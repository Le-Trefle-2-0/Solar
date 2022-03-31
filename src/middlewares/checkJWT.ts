import { PrismaClient } from "@prisma/client";
import { getCookie } from "cookies-next";
import { JwtPayload, verify } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import session, { sessionAccountWithRoles } from "../interfaces/session";
import prisma_instance from "../utils/prisma_instance";
import PrismaInstance from "../utils/prisma_instance";

export type NextApiRequestWithUser = NextApiRequest & {session: session};

export default async function checkJWT(req: NextApiRequestWithUser, res: NextApiResponse, next: () => any) {
    let session = await getSessionFromJWT(req, res);
    if(!session){
        res.status(401).send("Unauthorized");
    } else {
        req.session = session;
    }
    next()
}

export async function getSessionFromJWT(req: NextApiRequest, res: NextApiResponse) : Promise<session | null> {
    let sesRaw = getCookie("session", {req, res});
    let ses: session | undefined;
    if(sesRaw != undefined && typeof sesRaw != "boolean") ses = JSON.parse(sesRaw);
    const headerAuth: string | null = req.headers ? req.headers.authorization || null : null;
    if(!ses && !headerAuth)  return null;
    const jwt = ses ? ses.jwt : headerAuth!.replace("Bearer ", "");
    try{
        const jwtPayload: JwtPayload | string = verify(jwt, process.env.JWT_SECRET || "secret");
        if(jwtPayload && typeof jwtPayload != "string"){
            if(!ses){
                let user = await prisma_instance.accounts.findFirst({
                    where:{id: jwtPayload.id},
                    include:{roles: true}
                }) as sessionAccountWithRoles;
                delete user.password;
                return {
                    jwt: jwt,
                    user: user
                };
            } else {
                return ses;
            }
        }
    } catch {}
    return null;
}