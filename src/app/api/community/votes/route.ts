import { NextRequest, NextResponse } from 'next/server';
import { toggleVote, getUserVotes } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fingerprint = searchParams.get('fingerprint');
  if (!fingerprint) return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  const voted_ids = getUserVotes(fingerprint);
  return NextResponse.json({ voted_ids });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { post_id, fingerprint } = body;

  if (!post_id || !fingerprint) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  // Rate limit: 20 votes per minute per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit('vote:' + ip, 20, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: '操作太频繁' }, { status: 429 });
  }

  const result = toggleVote(post_id, fingerprint);
  return NextResponse.json(result);
}
