import prisma from "@/lib/prisma";

/*
 * Recruitment reads for server components only. They return whole rows, Discord webhook and
 * contact e-mail included, so they must never sit in a "use server" file: every export of
 * such a file is a server action that a browser can call.
 */

export async function getRecruitments() {
    return prisma.recruitment.findMany({
        orderBy: [
            {enabled: "desc"},
            {createdAt: "desc"}
        ],
    });
}

export async function getRecruitmentById(id: string) {
    return prisma.recruitment.findUnique({
        where: {id},
    });
}
