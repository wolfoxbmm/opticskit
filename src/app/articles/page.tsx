import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { Metadata } from 'next';
import ArticlesClient from './ArticlesClient';

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
  return <ArticlesClient articles={articles} />;
}
