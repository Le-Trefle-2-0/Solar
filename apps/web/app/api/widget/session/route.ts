import {NextRequest, NextResponse} from 'next/server';
import {createTicket} from '@/lib/ticketManager';
import crypto, {createHmac} from 'crypto';
import prisma from "@/lib/prisma";

function cookie(name: string, value: string, maxAgeSec = 60 * 60 * 24) {
    // Cookies must be simple here (readable by client code). We avoid HttpOnly so the widget can read them for WS auth.
    // Use Secure in production.
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

type GuestCreds = { channelId: string; uid: string; exp: number; sig: string };

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        // Force anonymity as requested: always "utilisateur"
        const visitorName = "utilisateur";

        const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';
        if (!process.env.WS_GUEST_SECRET && process.env.NODE_ENV === 'production') {
            console.error('[widget] FATAL: WS_GUEST_SECRET is missing in production');
            return NextResponse.json({success: false, error: 'missing_secret'}, {status: 500});
        }

        // Read any existing cookies
        const cookies = req.headers.get('cookie') || '';
        const map = new Map<string, string>();
        cookies.split(';').forEach((p) => {
            const [k, ...rest] = p.trim().split('=');
            if (!k) return;
            map.set(k, decodeURIComponent(rest.join('=')));
        });

        let channelId = map.get('widget_channel') || '';
        let uid = map.get('widget_uid') || '';
        let expStr = map.get('widget_exp') || '';
        let sig = map.get('widget_sig') || '';

        // If we have a channelId, verify the ticket still exists and is active
        if (channelId) {
            try {
                const ticket = await prisma.ticket.findUnique({
                    where: {channelId}
                });
                if (!ticket || ticket.statusName === 'closed' || ticket.statusName === 'commented') {
                    // Session is dead. Clear cookies and inform client.
                    const res = NextResponse.json({success: false, error: 'session_expired'});
                    res.headers.append('set-cookie', clearCookie('widget_channel'));
                    res.headers.append('set-cookie', clearCookie('widget_uid'));
                    res.headers.append('set-cookie', clearCookie('widget_exp'));
                    res.headers.append('set-cookie', clearCookie('widget_sig'));
                    res.headers.append('set-cookie', clearCookie('widget_public'));
                    return res;
                }
            } catch (err) {
                console.error('[widget] Error checking existing ticket:', err);
                channelId = '';
            }
        }

        // If we don't have a valid channel cookie, create a new ticket for this visitor
        if (!channelId) {
            try {
                const syntheticId = `web:${crypto.randomUUID()}`;
                const ua = req.headers.get('user-agent') || 'unknown';
                const ticket = await createTicket(syntheticId, 'web', {userAgent: ua, visitorName});
                channelId = ticket.channelId as string;
                console.log(`[widget] Created new ticket: ${ticket.id} for ${visitorName} (channel: ${channelId})`);

                // Best-effort notify the internal app to refresh ticket lists
                try {
                    let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
                    if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
                    if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);
                    const bSecret = process.env.WS_BROADCAST_SECRET || 'fallback_broadcast_secret_for_dev_only';
                    // Use a custom event understood by the internal sidebar to trigger updateTickets()
                    await fetch(`${base}/broadcast`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-ws-secret': bSecret,
                        },
                        body: JSON.stringify({event: 'updateRequest', data: {channelId}}),
                    }).catch(() => {
                    });
                } catch (err) {
                    console.warn('[widget] Failed to broadcast updateRequest:', err);
                }
            } catch (err) {
                console.error('[widget] Failed to create ticket:', err);
                return NextResponse.json({success: false, error: 'ticket_creation_failed'}, {status: 500});
            }
        }

        // Prepare guest credentials (24h validity)
        const now = Date.now();
        let exp = Number(expStr) || now + 24 * 60 * 60 * 1000;
        // If expired or missing, regenerate
        if (!uid) uid = `guest_${crypto.randomUUID()}`;
        if (!exp || exp <= now) exp = now + 24 * 60 * 60 * 1000;
        const authBase = `${channelId}.${uid}.${exp}`;
        const expectedSig = createHmac('sha256', secret).update(authBase).digest('hex');
        // If missing or doesn't match, overwrite
        if (!sig || sig !== expectedSig) sig = expectedSig;

        const creds: GuestCreds = {channelId, uid, exp, sig};

        const res = NextResponse.json({success: true, channelId, credentials: creds});
        // Set/update cookies
        res.headers.append('set-cookie', cookie('widget_channel', channelId));
        res.headers.append('set-cookie', cookie('widget_uid', uid));
        res.headers.append('set-cookie', cookie('widget_exp', String(exp)));
        res.headers.append('set-cookie', cookie('widget_sig', sig));
        // A marker cookie for public access
        res.headers.append('set-cookie', cookie('widget_public', '1'));
        return res;
    } catch (e) {
        console.error('[widget] session error:', e);
        return NextResponse.json({success: false, error: 'internal_error'}, {status: 500});
    }
}
