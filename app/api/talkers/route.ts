import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  const db = await getDb();
  const coll = db.collection('talkers');

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { id: { $regex: q, $options: 'i' } },
          { electorate: { $regex: q, $options: 'i' } },
          { party: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const docs = await coll
    .find(filter)
    .project({ _id: 0 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ value: docs });
}
