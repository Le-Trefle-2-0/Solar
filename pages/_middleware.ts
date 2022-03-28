import { NextResponse, NextRequest } from 'next/server';
import checkJWT from '../src/middlewares/checkJWT';

export async function middleware(req: NextRequest, res: NextRequest) {
  const { href, pathname } = req.nextUrl
  if (pathname == '/') {
    return NextResponse.redirect(href + 'listens');
  }
  return NextResponse.next()
}
