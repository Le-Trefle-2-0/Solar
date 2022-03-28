import { verify } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";

export default function checkJWT(req: NextApiRequest, res: NextApiResponse, next: () => any){
    const headerAuth: string | null = req.headers.authorization || null;
    if(headerAuth == null) res.status(401).send("Unauthorized");
    if(verify(headerAuth!.replace("Bearer ", ""), process.env.JWT_SECRET || "secret")){next()}
    res.status(401).send("Unauthorized");
}