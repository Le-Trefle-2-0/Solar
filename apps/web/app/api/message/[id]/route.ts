import {NextRequest, NextResponse} from 'next/server';
import prisma from '@/lib/prisma';
import {auth} from '@/lib/auth';
import {headers} from 'next/headers';

export async function DELETE(
    req: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({headers: await headers()});

    // Fallback to API key verification if no session (same pattern as channel/[id])
    let apiKeyAuthorized = false;
    if (!session) {
        const reqHeaders = await headers();
        const {valid} = await auth.api.verifyApiKey({
            body: {
                key: reqHeaders.get('token') as string,
            },
        });
        if (!valid) return new Response('Unauthorized', {status: 401});
        apiKeyAuthorized = true;
    }

    const {id} = await params;
    const messageIdNum = Number(id);
    if (Number.isNaN(messageIdNum)) {
        return NextResponse.json({success: false, error: 'Invalid id'}, {status: 400});
    }

    const message = await prisma.message.findUnique({where: {id: messageIdNum}});
    if (!message) return NextResponse.json({success: false, error: 'Not found'}, {status: 404});

    // Check ownership or manage permission for session users; API key auth bypasses user-bound checks
    let authorized = apiKeyAuthorized;
    if (!authorized && session) {
        authorized = message.userId === session.user.id;
        if (!authorized) {
            const perm = await auth.api.userHasPermission({
                body: {
                    userId: session.user.id,
                    permissions: {
                        messages: ['manage'],
                    },
                },
            });
            authorized = !!perm.success;
        }
    }

    if (!authorized) return NextResponse.json({success: false, error: 'Forbidden'}, {status: 403});

    // Delete reactions (if not cascaded) then delete message
    await prisma.reaction.deleteMany({where: {messageID: messageIdNum}});
    await prisma.message.delete({where: {id: messageIdNum}});

    // Emit socket event to the message's channel
    try {
        const io: any = (global as any).io;
        if (io) {
            io.to(message.channelId).emit('messageDelete', {messageID: messageIdNum});
        }
    } catch (e) {
        // ignore socket errors, deletion already done
    }

    return NextResponse.json({success: true, id: messageIdNum});
}

export async function PUT(
    req: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return new Response('Unauthorized', {status: 401});

    const {id} = await params;
    const messageIdNum = Number(id);
    if (Number.isNaN(messageIdNum)) {
        return NextResponse.json({success: false, error: 'Invalid id'}, {status: 400});
    }

    const body = await req.json().catch(() => ({}));
    const newContent: string | undefined = body?.content;
    if (typeof newContent !== 'string' || newContent.trim().length === 0 || newContent.length > 2000) {
        return NextResponse.json({success: false, error: 'Invalid content'}, {status: 400});
    }

    const message = await prisma.message.findUnique({where: {id: messageIdNum}});
    if (!message) return NextResponse.json({success: false, error: 'Not found'}, {status: 404});

    // Check ownership or manage permission
    let authorized = message.userId === session.user.id;
    if (!authorized) {
        const perm = await auth.api.userHasPermission({
            body: {
                userId: session.user.id,
                permissions: {
                    messages: ['manage']
                }
            }
        });
        authorized = !!perm.success;
    }
    if (!authorized) return NextResponse.json({success: false, error: 'Forbidden'}, {status: 403});

    const updated = await prisma.message.update({
        where: {id: messageIdNum},
        data: {
            content: Buffer.from(newContent, 'utf8'),
            edited: true,
        }
    });

    // Emit socket event to the message's channel
    try {
        const io: any = (global as any).io;
        if (io) {
            io.to(updated.channelId).emit('messageEdit', {messageID: messageIdNum, content: newContent, edited: true});
        }
    } catch (e) {
    }

    return NextResponse.json({success: true, id: messageIdNum, content: newContent, edited: true});
}
