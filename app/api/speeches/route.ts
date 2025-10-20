import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const talkerId = searchParams.get('talker_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  if (!talkerId) {
    return NextResponse.json({ error: 'talker_id is required' }, { status: 400 });
  }

  const db = await getDb();
  const coll = db.collection('speeches');

  // Sort by date desc then by speech_id and seq to keep order within a speech
  const docs = await coll
    .find({ talker_id: talkerId })
    .project({ _id: 0 })
    .sort({ date: -1, speech_id: 1, seq: 1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ value: docs });
}
