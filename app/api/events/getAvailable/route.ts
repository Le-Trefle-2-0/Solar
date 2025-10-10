import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {createHash} from "crypto";

export async function GET(req: NextRequest) {
    try {
        const {searchParams} = new URL(req.url);
        const channelID = searchParams.get("channelID");
        const lists = searchParams.get("lists");

        // If no channelID provided, return all users (backward compatible)
        if (!channelID) {
            const users = await prisma.user.findMany();
            return NextResponse.json(users, {status: 200});
        }

        // Find the ticket by channelID to determine requester
        const ticket = await prisma.ticket.findUnique({
            where: {channelId: channelID}
        });

        if (!ticket) {
            const users = await prisma.user.findMany();
            return NextResponse.json(users, {status: 200});
        }

        const requesterIdPlain = ticket.discordUserID;
        const requesterIdHash = createHash("sha256").update(requesterIdPlain).digest("hex");

        // If specifically asking for ineligibility lists, compute both (text and voice)
        if (lists === "ineligible") {
            const users = await prisma.user.findMany();

            // Text: 20 days, voice = false
            const textWindowStart = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
            const textTickets = await prisma.ticket.findMany({
                where: {
                    createdAt: {gte: textWindowStart},
                    voice: false,
                    discordUserID: {in: [requesterIdPlain, requesterIdHash]},
                },
                select: {assignedUserId: true},
            });
            const textIds = new Set(
                textTickets.map(t => t.assignedUserId).filter((id): id is string => !!id)
            );
            const ineligibleText = users.filter(u => textIds.has(u.id));

            // Voice: 30 days, voice = true
            const voiceWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const voiceTickets = await prisma.ticket.findMany({
                where: {
                    createdAt: {gte: voiceWindowStart},
                    voice: true,
                    discordUserID: {in: [requesterIdPlain, requesterIdHash]},
                },
                select: {assignedUserId: true},
            });
            const voiceIds = new Set(
                voiceTickets.map(t => t.assignedUserId).filter((id): id is string => !!id)
            );
            const ineligibleVoice = users.filter(u => voiceIds.has(u.id));

            return NextResponse.json({ineligibleText, ineligibleVoice}, {status: 200});
        }

        // Default behavior: compute eligible users for the current ticket modality
        const isVoice = !!ticket.voice;
        const windowDays = isVoice ? 30 : 20;
        const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

        const recentTickets = await prisma.ticket.findMany({
            where: {
                createdAt: {gte: windowStart},
                voice: isVoice,
                discordUserID: {in: [requesterIdPlain, requesterIdHash]},
            },
            select: {assignedUserId: true}
        });

        const excludedUserIds = new Set(
            recentTickets
                .map(t => t.assignedUserId)
                .filter((id): id is string => !!id)
        );

        const users = await prisma.user.findMany();
        const eligible = users.filter(u => !excludedUserIds.has(u.id));
        return NextResponse.json(eligible, {status: 200});
    } catch (e) {
        return NextResponse.json({success: false, error: "Failed to compute available users"}, {status: 500});
    }
}