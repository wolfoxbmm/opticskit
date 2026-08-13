import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ARTICLES_DIR = '/home/admin/opticskit/articles';
const INDEX_PATH = path.join(ARTICLES_DIR, 'index.json');
const HTML_DIR = path.join(ARTICLES_DIR, 'html');
const STRIP_SCRIPT = '/tmp/strip_footer.py';
const UPLOAD_DIR = '/home/admin/opticskit/data/uploads';

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('opticskit_admin')?.value;
  return token === ADMIN_PASSWORD && ADMIN_PASSWORD !== '';
}

// POST — 上传 HTML 文件（from drag-drop）
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    const date = formData.get('date') as string;

    if (!file || !slug || !title) {
      return NextResponse.json({ error: '缺少必填字段: file, slug, title' }, { status: 400 });
    }

    // Validate slug: lowercase, hyphens only
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug 只能包含小写字母、数字和连字符' }, { status: 400 });
    }

    const steps: string[] = [];

    // Ensure upload dir exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Save uploaded file temporarily
    const tempPath = path.join(UPLOAD_DIR, `${slug}-${Date.now()}.html`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    steps.push('文件已上传');

    // Copy to articles html dir
    const targetPath = path.join(HTML_DIR, `${slug}.html`);
    fs.copyFileSync(tempPath, targetPath);
    fs.unlinkSync(tempPath); // clean temp
    steps.push('HTML 已就位');

    // Strip footer
    execSync(`python3 ${STRIP_SCRIPT} ${targetPath}`, { timeout: 30000 });
    steps.push('footer 已去除');

    // Update index.json — backup first
    const articles = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    const today = date || new Date().toISOString().slice(0, 10);
    const newArticle = {
      slug,
      title,
      summary: summary || title,
      date: today,
    };
    const existing = articles.findIndex((a: any) => a.slug === slug);
    if (existing >= 0) {
      articles[existing] = newArticle;
      steps.push('已更新已有文章');
    } else {
      articles.unshift(newArticle);
      steps.push('已添加新文章');
    }
    fs.writeFileSync(`${INDEX_PATH}.bak.json`, fs.readFileSync(INDEX_PATH));
    fs.writeFileSync(INDEX_PATH, JSON.stringify(articles, null, 2));
    steps.push(`index.json 已更新 (共 ${articles.length} 篇)`);

    // Rebuild
    execSync('cd /home/admin/opticskit && rm -rf .next && npm run build', { timeout: 300000 });
    steps.push('项目已重建');

    // Restart
    execSync('sudo kill $(ps aux | grep "next-server" | grep -v grep | awk "{print \\$2}") 2>/dev/null; sleep 1; sudo systemctl restart opticskit', { timeout: 30000 });
    steps.push('服务已重启');

    return NextResponse.json({ success: true, steps, slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
