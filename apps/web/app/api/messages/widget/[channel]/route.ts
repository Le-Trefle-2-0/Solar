import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {saveMessage} from "@/lib/messageManager";

async function getOrCreateWidgetUser(id: string, name: string) {
    let user = await prisma.user.findUnique({where: {id}});
    if (!user) {
        const now = new Date();
        user = await prisma.user.create({
            data: {
                id,
                name: name,
                email: `${id}@solar.local`,
                emailVerified: false,
                createdAt: now,
                updatedAt: now,
                role: 'visitor'
            },
        });
    } else if (user.name !== name) {
        // Update name if it changed
        user = await prisma.user.update({
            where: {id},
            data: {name}
        });
    }
    return user;
}

export async function POST(
    req: NextRequest,
    {params}: { params: Promise<{ channel: string }> }
) {
    try {
        const {channel} = await params;
        const body = await req.json();
        const content: string = (body?.content ?? '').toString();
        const replyID = body?.replyID ? Number(body.replyID) : undefined;
        if (!content || !channel) {
            return NextResponse.json({success: false, message: 'Invalid payload'}, {status: 400});
        }

        // Get visitor info from cookies and ticket
        const cookies = req.headers.get('cookie') || '';
        const uidMatch = cookies.match(/widget_uid=([^;]+)/);
        const uid = uidMatch ? decodeURIComponent(uidMatch[1]) : `guest_${crypto.randomUUID()}`;

        const ticket = await prisma.ticket.findUnique({where: {channelId: channel}});
        const visitorName = (ticket?.metadata as any)?.visitorName || 'utilisateur';

        const user = await getOrCreateWidgetUser(uid, visitorName);
        const msg = {
            author: {
                id: user.id,
                name: user.name,
                image: user.image as string,
                role: user.role as string,
            },
            content,
            timestamp: Date.now(),
            channel: {id: channel},
            token: '',
            discordID: '',
            reactions: [],
            replyID,
        };
        const message = await saveMessage(msg as any);

        // Attempt to broadcast to Socket.IO room so internal app receives live
        try {
            // Prefer internal URL for server-to-server call, then public, then localhost
            let base = process.env.WS_INTERNAL_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
            // Normalize ws(s) scheme to http(s) for fetch
            if (base.startsWith('ws://')) base = 'http://' + base.slice('ws://'.length);
            if (base.startsWith('wss://')) base = 'https://' + base.slice('wss://'.length);
            const secret = process.env.WS_BROADCAST_SECRET || 'fallback_broadcast_secret_for_dev_only';
            const payload = {
                room: channel,
                data: {
                    // match app-side expectations used in SocketProvider toast handler
                    id: message.id,
                    author: {
                        id: user.id,
                        image: user.image,
                        name: user.name,
                        role: user.role,
                    },
                    content,
                    timestamp: Date.now(),
                    channel: {id: channel},
                    discordID: null,
                    reactions: [],
                    replyID: replyID ?? null,
                    edited: false,
                },
            };
            await fetch(`${base}/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-ws-secret': secret,
                },
                body: JSON.stringify(payload),
            }).catch((e) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('[widget] broadcast failed (fetch catch):', e);
                }
            });
        } catch (err) {
            // ignore broadcast errors; polling will still pick up the message
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[widget] broadcast failed (try/catch):', err);
            }
        }

        return NextResponse.json({success: true, message}, {status: 200});
    } catch (e) {
        return NextResponse.json({success: false, message: 'Internal server error'}, {status: 500});
    }
}
