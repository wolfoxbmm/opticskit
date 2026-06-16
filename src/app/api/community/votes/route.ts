import { NextRequest, NextResponse } from 'next/server';
import { toggleVote, getUserVotes } from '@/lib/db';

// POST /api/community/votes — toggle vote
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { post_id, fingerprint } = body;

  if (!post_id || !fingerprint) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  const result = toggleVote(post_id, fingerprint);
  return NextResponse.json(result);
}

// GET /api/community/votes?fingerprint=xxx — get user's voted posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fingerprint = searchParams.get('fingerprint');
  if (!fingerprint) return NextResponse.json({ error: '缺少 fingerprint' }, { status: 400 });

  const votedIds = getUserVotes(fingerprint);
  return NextResponse.json({ voted_ids: votedIds });
}
