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

export const metadata: Metadata = {
  title: '精选文章 - OpticsKit 光学工具箱',
  description: '光学技术干货文章，涵盖光谱分析、激光器、探测器、光纤通信等方向',
};

export default function ArticlesPage() {
  const articles = getArticles();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">📖 精选文章</h1>
          <p className="text-[13px] text-[#868E96] mt-1">
            光学技术干货，每周更新 · 共 {articles.length} 篇
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="block bg-white rounded-xl border border-[#E9ECEF] p-5 hover:border-[#228BE6]/30 hover:shadow-sm transition-all group"
            >
              <h2 className="text-[15px] font-semibold text-[#1A1A2E] group-hover:text-[#228BE6] transition-colors leading-relaxed">
                {a.title}
              </h2>
              <p className="text-[13px] text-[#868E96] mt-1.5 line-clamp-2">{a.summary}</p>
              <p className="text-[12px] text-[#ADB5BD] mt-2">{a.date}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-5 bg-white rounded-xl border border-[#E9ECEF] text-center">
          <p className="text-[13px] text-[#868E96]">
            关注公众号 <span className="text-[#495057] font-semibold">光学科技资讯</span>，获取更多光学技术干货
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[13px] text-[#868E96] hover:text-[#495057] transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
