import prisma from "@/lib/prisma";

export async function findUser(id: string) {
    const user = await prisma.user.findUnique({
        where: {
            id
        }
    });

    return user;
}