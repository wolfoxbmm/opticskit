import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Article {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

function getArticles(): Article[] {
  const p = path.join(process.cwd(), 'articles', 'index.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export async function generateStaticParams() {
  return getArticles().map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const articles = getArticles();
  const article = articles.find(a => a.slug === slug);
  if (!article) return { title: '文章未找到' };
  return {
    title: `${article.title} - OpticsKit`,
    description: article.summary,
    openGraph: { title: article.title, description: article.summary, type: 'article' },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articles = getArticles();
  const idx = articles.findIndex(a => a.slug === slug);
  if (idx === -1) return <div className="p-8 text-center">文章未找到</div>;

  const article = articles[idx];
  const htmlPath = path.join(process.cwd(), 'articles', 'html', `${slug}.html`);
  let html = '';
  try { html = fs.readFileSync(htmlPath, 'utf-8'); } catch { html = '<p>文章内容加载失败</p>'; }

  const prev = idx < articles.length - 1 ? articles[idx + 1] : null;
  const next = idx > 0 ? articles[idx - 1] : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[720px] mx-auto px-4 py-8">
        <Link href="/articles" className="inline-flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#4B5563] transition-colors mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          返回文章列表
        </Link>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-3 border-b border-[#F3F4F6]">
            <h1 className="text-[22px] font-bold text-[#111827] leading-relaxed">{article.title}</h1>
            <p className="text-[13px] text-[#9CA3AF] mt-2">{article.date}</p>
          </div>
          <div className="px-6 py-4" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <div className="mt-8 flex justify-between items-center text-[13px]">
          {prev ? (
            <Link href={`/articles/${prev.slug}`} className="text-[#2563EB] hover:underline">← {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={`/articles/${next.slug}`} className="text-[#2563EB] hover:underline text-right">{next.title} →</Link>
          ) : <span />}
        </div>

        <div className="mt-8 p-5 bg-white rounded-xl border border-[#E5E7EB] text-center">
          <p className="text-[13px] text-[#6B7280]">
            关注公众号 <span className="text-[#4B5563] font-semibold">OpticsKit</span>，获取更多光学技术干货
          </p>
        </div>
      </div>
    </div>
  );
}
