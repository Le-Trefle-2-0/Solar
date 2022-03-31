import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse, NextRequest } from 'next/server';
import checkJWT, { getSessionFromJWT } from '../src/middlewares/checkJWT';

export async function middleware(req: NextApiRequest & NextRequest, res: NextApiResponse & NextResponse) {
  const { href, pathname } = req.nextUrl
  switch(pathname) {
    case "/": return NextResponse.redirect(href + 'listens');
  }
  return NextResponse.next()
}
