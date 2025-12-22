import {NextRequest, NextResponse} from 'next/server';
import {createTicket} from '@/lib/ticketManager';
import {createHmac} from 'crypto';

function cookie(name: string, value: string, maxAgeSec = 60 * 60 * 24) {
    // Cookies must be simple here (readable by client code). We avoid HttpOnly so the widget can read them for WS auth.
    // Use Secure in production.
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

type GuestCreds = { channelId: string; uid: string; exp: number; sig: string };

export async function POST(req: NextRequest) {
    try {
        const secret = process.env.WS_GUEST_SECRET || '';
        if (!secret) {
            return NextResponse.json({success: false, error: 'missing_secret'}, {status: 200});
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

        // If we don't have a valid channel cookie, create a new ticket for this visitor
        if (!channelId) {
            const syntheticId = `web:${crypto.randomUUID()}`;
            const ticket = await createTicket(syntheticId);
            channelId = ticket.channelId as string;
            // Best-effort notify the internal app to refresh ticket lists
            try {
                let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
                if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
                if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);
                const bSecret = process.env.WS_BROADCAST_SECRET || '';
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
            } catch {
            }
        }

        // Prepare guest credentials (24h validity)
        const now = Date.now();
        let exp = Number(expStr) || now + 24 * 60 * 60 * 1000;
        // If expired or missing, regenerate
        if (!uid) uid = `guest_${crypto.randomUUID()}`;
        if (!exp || exp <= now) exp = now + 24 * 60 * 60 * 1000;
        const base = `${channelId}.${uid}.${exp}`;
        const expectedSig = createHmac('sha256', secret).update(base).digest('hex');
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
        return NextResponse.json({success: false, error: 'internal_error'}, {status: 200});
    }
}
