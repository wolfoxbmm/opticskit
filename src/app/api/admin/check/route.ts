import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('opticskit_admin')?.value;
  return NextResponse.json({ loggedIn: token === ADMIN_PASSWORD && ADMIN_PASSWORD !== '' });
}
