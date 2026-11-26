"use server"
import {headers} from "next/headers";
import prisma from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {canWriteChannel, MessageInputSchema} from "@/lib/security/channelAccess";
import {neutralizeHtml} from "@/lib/security/sanitize";
import {getRolePermissions} from "@/lib/userPermissions";

/**
 * Server action: anyone can call it with any argument, so nothing from the
 * client is trusted (#238). The author is the session user, the channel rule is
 * checked and the content is validated before being touched.
 */
export const saveMessage = async (input: unknown) => {
    const parsed = MessageInputSchema.safeParse(input);
    if (!parsed.success) throw new Error("Invalid message");
    const {channelId, replyID} = parsed.data;

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;

    const ticket = await prisma.ticket.findUnique({
        where: {channelId},
        select: {id: true, assignedUserId: true},
    });
    const permissions = await getRolePermissions((session.user as {role?: string | null}).role, userId);
    // A permanence's channel is open to every member, signed up or not
    const isPermanence = !ticket && !!(await prisma.event.findFirst({where: {channelID: channelId}, select: {id: true}}));
    if (!canWriteChannel({channelId, userId, permissions, assignedUserId: ticket?.assignedUserId ?? null, isPermanence})) {
        throw new Error("Forbidden");
    }

    // Defence in depth against stored XSS, as in the API (#163)
    const content = neutralizeHtml(parsed.data.content);
    const message = await prisma.message.create({
        data: {
            createdAt: new Date(),
            userId,
            channelId,
            ticketId: ticket?.id,
            content: Buffer.from(content, "utf8"),
            replyID: replyID ?? undefined,
        },
        select: {id: true},
    });

    return {id: message.id, content};
}
