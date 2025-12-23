import {NextRequest, NextResponse} from 'next/server';
import {createHmac} from 'crypto';

// Issues a short-lived guest credential for Socket.IO auth, restricted to one channel
// POST body: { channelId: string, uid?: string }
export async function POST(req: NextRequest) {
    try {
        const secret = process.env.WS_GUEST_SECRET || 'fallback_secret_for_dev_only';
        // Do NOT return 500 here to avoid client retry spam; indicate failure cleanly.
        if (!secret) return NextResponse.json({success: false, error: 'missing_secret'}, {status: 200});

        const body = await req.json().catch(() => ({}));
        const channelId: string = String(body?.channelId || '');
        let uid: string = String(body?.uid || '');
        if (!channelId) return NextResponse.json({success: false, error: 'invalid_channel'}, {status: 200});
        if (!uid) uid = `guest_${crypto.randomUUID()}`;

        // Default validity: 24h
        const exp = Date.now() + 24 * 60 * 60 * 1000;
        const base = `${channelId}.${uid}.${exp}`;
        const sig = createHmac('sha256', secret).update(base).digest('hex');

        return NextResponse.json({success: true, credentials: {channelId, uid, exp, sig}}, {status: 200});
    } catch (e) {
        // Also avoid 500s on malformed requests to prevent client retry storms
        return NextResponse.json({success: false, error: 'internal_error'}, {status: 200});
    }
}
