import {auth} from "@/lib/auth"; // path to your auth file
import {toNextJsHandler} from "better-auth/next-js";

const handler = toNextJsHandler(auth);

export const POST = async (req: Request) => {
    console.log(`[auth] POST ${req.url}`);

    // Explicitly handle forget-password if it's returning 404
    if (req.url.includes("forget-password") || req.url.includes("forgot-password")) {
        console.log(`[auth] Force handling forget-password request`);
    }

    const res = await handler.POST(req);
    console.log(`[auth] POST ${req.url} - Status: ${res.status}`);
    return res;
};

export const GET = async (req: Request) => {
    console.log(`[auth] GET ${req.url}`);
    const res = await handler.GET(req);
    console.log(`[auth] GET ${req.url} - Status: ${res.status}`);
    return res;
};