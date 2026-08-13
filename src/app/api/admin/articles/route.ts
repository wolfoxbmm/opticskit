import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = '/home/admin/opticskit/articles';
const INDEX_PATH = path.join(ARTICLES_DIR, 'index.json');

export async function GET() {
  try {
    const articles = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    return NextResponse.json({ articles });
  } catch (e: any) {
    return NextResponse.json({ articles: [], error: e.message });
  }
}
