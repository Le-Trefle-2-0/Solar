import {auth} from "@/lib/auth"; // path to your auth file
import {toNextJsHandler} from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const POST = async (req: Request) => {
    return await handler.POST(req);
};

export const GET = async (req: Request) => {
    return await handler.GET(req);
};