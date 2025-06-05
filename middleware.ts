import { auth } from "@/auth";

const publicRoutes = ['/api/auth/signin', '/api/auth/signin/discord', '/api/auth/callback/discord']

export default auth((req) => {
    if (!req.auth && !publicRoutes.includes(req.nextUrl.pathname)) {
        const newUrl = new URL('/api/auth/signin', req.nextUrl.origin);
        console.log(req.nextUrl.pathname);
        return Response.redirect(newUrl);
    }
})