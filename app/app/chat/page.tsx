import {subHours} from 'date-fns';
import {Chat} from "@/components/chat";
import prisma from "@/lib/prisma";

export default async function MainChat() {
    const now = new Date();
    const twoHoursAgo = subHours(now, 2);

    let event = await prisma.event.findFirst({
        where: {
            start: {lte: now},
            end: {gte: now},
        },
        orderBy: {start: 'asc'},
    });

    if (!event) {
        event = await prisma.event.findFirst({
            where: {
                end: {
                    lte: now,
                    gte: twoHoursAgo,
                },
            },
            orderBy: {end: 'desc'},
        });
    }

    if (!event) {
        event = await prisma.event.findFirst({
            where: {
                start: {gt: now},
            },
            orderBy: {start: 'asc'},
        });
    }

    if (event) {
        return (
            <Chat channelID={event.channelID} statusID={0}/>
        )
    }

    return (
        <div className="flex justify-center items-center w-full h-screen">
            <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
                Aucune permanence en cours ni programmée
            </h1>
        </div>
    );
}
