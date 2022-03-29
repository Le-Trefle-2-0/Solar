import { PrismaClient } from "@prisma/client";
import { JwtPayload, verify } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import session, { sessionAccountWithRoles } from "../interfaces/session";

export type NextApiRequestWithUser = NextApiRequest & {session: session};

export default async function checkJWT(req: NextApiRequestWithUser, res: NextApiResponse, next: () => any) {
    const headerAuth: string | null = req.headers.authorization || null;
    if(headerAuth == null) res.status(401).send("Unauthorized");
    const jwt = headerAuth!.replace("Bearer ", "")
    try{
        const jwtPayload: JwtPayload | string = verify(jwt, process.env.JWT_SECRET || "secret");
        if(jwtPayload && typeof jwtPayload != "string"){
            const prisma = new PrismaClient();
            let user = await prisma.accounts.findFirst({
                where:{id: jwtPayload.id},
                include:{roles: true}
            }) as sessionAccountWithRoles;
            delete user.password;
            req.session = {
                jwt: jwt,
                user: user
            };
            next();
            return;
        }
    } catch {
        res.status(401).send("Unauthorized");
    }
    res.status(401).send("Unauthorized");
}