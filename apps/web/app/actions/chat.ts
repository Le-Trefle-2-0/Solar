"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {revalidatePath} from "next/cache";
import {broadcast} from "@/lib/broadcast";

export async function markChannelAsRead(channelId: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    try {
        await prisma.userChannelRead.upsert({
            where: {
                userId_channelId: {
                    userId,
                    channelId
                }
            },
            update: {
                lastRead: new Date()
            },
            create: {
                userId,
                channelId,
                lastRead: new Date()
            }
        });

        await broadcast(null, 'channelRead', {userId, channelId});

        revalidatePath('/app', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark channel as read:", error);
        return { success: false, error: "Internal error" };
    }
}
