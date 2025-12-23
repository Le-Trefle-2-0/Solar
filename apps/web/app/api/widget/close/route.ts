import {NextRequest, NextResponse} from 'next/server';
import prisma from "@/lib/prisma";

function clearCookie(name: string) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export async function POST(req: NextRequest) {
    try {
        // Read existing cookies to identify the guest's session
        const cookies = req.headers.get('cookie') || '';
        const map = new Map<string, string>();
        cookies.split(';').forEach((p) => {
            const [k, ...rest] = p.trim().split('=');
            if (!k) return;
            map.set(k, decodeURIComponent(rest.join('=')));
        });

        const channelId = map.get('widget_channel');
        if (!channelId) {
            return NextResponse.json({success: false, error: 'no_active_session'}, {status: 401});
        }

        // Verify the ticket exists and belongs to a web source (optional but safer)
        const ticket = await prisma.ticket.findUnique({
            where: {channelId}
        });

        if (!ticket) {
            return NextResponse.json({success: false, error: 'ticket_not_found'}, {status: 404});
        }

        // Ensure it's not already closed/commented to avoid redundant work
        if (ticket.statusName === 'closed' || ticket.statusName === 'commented') {
            const res = NextResponse.json({success: true, status: ticket.statusName});
            res.headers.append('set-cookie', clearCookie('widget_channel'));
            res.headers.append('set-cookie', clearCookie('widget_uid'));
            res.headers.append('set-cookie', clearCookie('widget_exp'));
            res.headers.append('set-cookie', clearCookie('widget_sig'));
            res.headers.append('set-cookie', clearCookie('widget_public'));
            return res;
        }

        // Call the internal API to perform the closure logic (hashing ID, updating status, broadcasting)
        const apiBase = process.env.API_BASE_URL || 'http://localhost:4000';
        const resInternal = await fetch(`${apiBase}/v1/tickets/close`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({channelID: channelId}),
        });

        if (!resInternal.ok) {
            const err = await resInternal.text();
            console.error('[widget] Failed to close ticket via internal API:', err);
            return NextResponse.json({success: false, error: 'internal_api_error'}, {status: 500});
        }

        const data = await resInternal.json();
        const res = NextResponse.json({success: true, ticket: data.update});
        res.headers.append('set-cookie', clearCookie('widget_channel'));
        res.headers.append('set-cookie', clearCookie('widget_uid'));
        res.headers.append('set-cookie', clearCookie('widget_exp'));
        res.headers.append('set-cookie', clearCookie('widget_sig'));
        res.headers.append('set-cookie', clearCookie('widget_public'));
        return res;
    } catch (e) {
        console.error('[widget] close error:', e);
        return NextResponse.json({success: false, error: 'internal_error'}, {status: 500});
    }
}
