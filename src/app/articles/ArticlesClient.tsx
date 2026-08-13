'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Article {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

export default function ArticlesClient({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? articles.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.summary.toLowerCase().includes(query.toLowerCase())
      )
    : articles;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111827]">📖 精选文章</h1>
          <p className="text-[13px] text-[#6B7280] mt-2">
            光学技术干货 · 共 {articles.length} 篇
          </p>
        </div>

        {/* Search box */}
        <div className="relative mb-8">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文章标题或内容..."
            className="w-full py-3 rounded-xl border border-[#D1D5DB] bg-white text-sm outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all shadow-sm"
            style={{ paddingLeft: '40px', paddingRight: '48px' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
            >
              清除
            </button>
          )}
        </div>

        {/* Results count */}
        {query && (
          <p className="text-[12px] text-[#6B7280] mb-4">
            找到 {filtered.length} 篇与「{query}」相关的文章
          </p>
        )}

        {/* Article list */}
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="block bg-white rounded-xl border border-[#E5E7EB] p-5 hover:border-[#2563EB]/30 hover:shadow-sm transition-all group"
            >
              <h2 className="text-[15px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors leading-relaxed">
                {a.title}
              </h2>
              <p className="text-[13px] text-[#6B7280] mt-1.5 line-clamp-2">{a.summary}</p>
              <p className="text-[12px] text-[#9CA3AF] mt-2">{a.date}</p>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#9CA3AF]">
              <p className="text-lg mb-2">🔍</p>
              <p className="text-sm">没有找到相关文章</p>
              <button onClick={() => setQuery('')} className="text-[13px] text-[#2563EB] mt-2 hover:underline">清除搜索</button>
            </div>
          )}
        </div>

        <div className="mt-8 p-5 bg-white rounded-xl border border-[#E5E7EB] text-center">
          <p className="text-[13px] text-[#6B7280]">
            关注公众号 <span className="text-[#4B5563] font-semibold">OpticsKit</span>，获取更多光学技术干货
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[13px] text-[#6B7280] hover:text-[#4B5563] transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
