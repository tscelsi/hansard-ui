import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.redirect(new URL(`/bill/${encodeURIComponent(id)}`, req.url));
}
