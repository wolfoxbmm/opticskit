import { NextRequest, NextResponse } from 'next/server';
import { getReplies, createReply, deleteReply } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('opticskit_admin')?.value;
  return token === ADMIN_PASSWORD;
}

// GET /api/community/replies?post_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');
  if (!postId) return NextResponse.json({ error: '缺少 post_id' }, { status: 400 });

  const replies = getReplies(postId);
  return NextResponse.json({ replies });
}

// POST /api/community/replies
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { post_id, content, author_name, is_official } = body;

  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: '回复不能超过500字' }, { status: 400 });
  }

  const official = isAdmin(req) && is_official === true;
  const reply = createReply({ post_id, content: content.trim(), author_name, is_official: official });
  return NextResponse.json({ reply }, { status: 201 });
}

// DELETE /api/community/replies?id=xxx (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const ok = deleteReply(id);
  if (!ok) return NextResponse.json({ error: '回复不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
