import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost, deletePost, togglePin } from '@/lib/db';

const SENSITIVE_WORDS = [
  '广告', '推广', '免费领取', '免费送', '限时优惠', '优惠券',
  '加微信', '微信号', '微信咨询', '微信联系', '扫码添加',
  'QQ群', 'QQ号', 'QQ咨询', '二维码', '扫码', '扫一扫',
  '联系方式', '联系电话', '联系客服', '点击链接', '点击购买',
  '立即购买', '下单', '拼团', '注册送', '注册即送', '下载APP',
  '下载应用', '包邮', '特价', '打折', '活动价', '促销', '大促',
  '招代理', '招加盟', '招合伙人', '躺着赚钱', '月入过万', '轻松赚钱',
  '兼职', '刷单', '日结', '日赚', '副业', '兼职赚钱',
  '代购', '代考', '代写', '论文代写', '作业代写',
  '银行卡', '信用卡', '贷款', '套现', '借条',
  '培训', '课程', '报名', '学费', '网址', '官网', '淘宝', '拼多多', '京东',
  '赌博', '彩票', '毒品', '代开发票', '办证',
  '色情', '裸聊', '约炮', '成人',
  'VPN', '翻墙', '科学上网', '梯子',
  '政治敏感', '法轮功', '六四', '天安门'
];

const SENSITIVE_PATTERNS = [
  /v[\s]*p[\s]*n/i,
  /f[\s]*a[\s]*l[\s]*u[\s]*n/i,
  /加[\s]*我[\s]*微[\s]*信/i,
  /加[\s]*微[\s]*信[\s]*[:：]?/i,
  /w[\s]*x[\s]*[:：]/i,
  /q[\s]*q[\s]*[:：]?[\s]*\d/i,
  /微[\s]*信[\s]*号[\s]*[:：]?/i,
  /1[3-9]\d{9}/,
  /\d{3,4}[-\s]?\d{7,8}/,
  /http[s]?:\/\//i,
  /www\.[a-z]/i,
  /[a-z0-9]+\.[a-z]{2,}\/[a-z]/i
];

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'opticskit2024';

function checkSensitive(text: string): { found: boolean; word: string } {
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) return { found: true, word };
  }
  for (const pattern of SENSITIVE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { found: true, word: match[0] };
  }
  return { found: false, word: '' };
}

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('opticskit_admin')?.value;
  return token === ADMIN_PASSWORD;
}

// GET /api/community — list posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = (searchParams.get('sort') || 'hot') as 'hot' | 'new';
  const tag = searchParams.get('tag') || 'all';
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const posts = getPosts({ sort, tag, search, limit, offset });
  return NextResponse.json({ posts });
}

// POST /api/community — create post
export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
  const { content, tag, author_name, is_official } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: '内容不能超过500字' }, { status: 400 });
  }
  if (!['suggestion', 'bug', 'discussion'].includes(tag)) {
    return NextResponse.json({ error: '请选择分类' }, { status: 400 });
  }

  // Check sensitive words (admin bypass)
  if (!isAdmin(req)) {
    const check = checkSensitive(content);
    if (check.found) {
      return NextResponse.json({ error: `包含敏感词: ${check.word}` }, { status: 400 });
    }
  }

  // Only admin can post as official
  const official = isAdmin(req) && is_official === true;
  const post = createPost({ content: content.trim(), tag, author_name, is_official: official });
  return NextResponse.json({ post }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/community error:', e);
    return NextResponse.json({ error: '服务器错误: ' + (e.message || '未知') }, { status: 500 });
  }
}

// DELETE /api/community?id=xxx — delete post (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const ok = deletePost(id);
  if (!ok) return NextResponse.json({ error: '留言不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}

// PATCH /api/community?id=xxx — toggle pin (admin only)
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const post = togglePin(id);
  if (!post) return NextResponse.json({ error: '留言不存在' }, { status: 404 });
  return NextResponse.json({ post });
}
