import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = '/home/admin/opticskit/data';
const PV_FILE = path.join(DATA_DIR, 'pageviews.json');
const SESSION_TTL = 30 * 60 * 1000;

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) { hash = ((hash << 5) - hash) + ip.charCodeAt(i); hash |= 0; }
  return 's' + Math.abs(hash).toString(36);
}

function readPV(): any {
  try { if (fs.existsSync(PV_FILE)) return JSON.parse(fs.readFileSync(PV_FILE, 'utf-8')); } catch {}
  return { __total__: { pv: 0, uv: 0, sessions: {} } };
}

function writePV(data: any) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(PV_FILE)) try { fs.copyFileSync(PV_FILE, PV_FILE + '.bak'); } catch {}
  fs.writeFileSync(PV_FILE, JSON.stringify(data));
}

function getSource(referer: string): string {
  if (!referer) return 'direct';
  const r = referer.toLowerCase();
  if (r.includes('baidu.com')) return 'baidu';
  if (r.includes('google.com')) return 'google';
  if (r.includes('bing.com')) return 'bing';
  if (r.includes('weixin') || r.includes('wechat') || r.includes('mp.')) return 'wechat';
  if (r.includes('zhihu.com')) return 'zhihu';
  if (r.includes('bilibili.com')) return 'bilibili';
  if (r.includes('opticskit.cn')) return 'internal';
  return 'other';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const page = body.page || '/';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ua = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const sessionId = hashIP(ip + ua.substring(0, 50));
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();
    const source = getSource(referer);
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);

    const data = readPV();

    // --- Per-page stats ---
    if (!data[page]) data[page] = { pv: 0, uv: 0, sessions: {}, daily: {} };
    const entry = data[page];
    entry.pv++;
    if (!entry.sessions[sessionId] || now - entry.sessions[sessionId] > SESSION_TTL) entry.uv++;
    entry.sessions[sessionId] = now;

    // Daily breakdown
    if (!entry.daily[today]) entry.daily[today] = { pv: 0, uv: 0, sessions: {} };
    const dp = entry.daily[today]; dp.pv++;
    if (!dp.sessions[sessionId] || now - dp.sessions[sessionId] > SESSION_TTL) dp.uv++;
    dp.sessions[sessionId] = now;

    // --- Global total ---
    const total = data['__total__'];
    total.pv++;
    if (!total.sessions[sessionId] || now - total.sessions[sessionId] > SESSION_TTL) total.uv++;
    total.sessions[sessionId] = now;

    // Global daily
    if (!data['__daily__']) data['__daily__'] = {};
    if (!data['__daily__'][today]) data['__daily__'][today] = { pv: 0, uv: 0, sessions: {}, sources: {}, devices: { mobile: 0, desktop: 0 } };
    const gd = data['__daily__'][today];
    gd.pv++;
    if (!gd.sessions[sessionId] || now - gd.sessions[sessionId] > SESSION_TTL) gd.uv++;
    gd.sessions[sessionId] = now;

    // Source tracking (UV-based per source)
    if (!gd.sources) gd.sources = {};
    if (!gd.sources[source]) gd.sources[source] = { pv: 0, uv: 0, sessions: {} };
    gd.sources[source].pv++;
    if (!gd.sources[source].sessions[sessionId] || now - gd.sources[source].sessions[sessionId] > SESSION_TTL) gd.sources[source].uv++;
    gd.sources[source].sessions[sessionId] = now;

    // Device tracking
    if (!gd.devices) gd.devices = { mobile: 0, desktop: 0 };
    if (isMobile) gd.devices.mobile++; else gd.devices.desktop++;

    // Global source aggregation
    if (!data['__sources__']) data['__sources__'] = {};
    if (!data['__sources__'][source]) data['__sources__'][source] = { pv: 0, uv: 0, sessions: {} };
    data['__sources__'][source].pv++;
    if (!data['__sources__'][source].sessions[sessionId] || now - data['__sources__'][source].sessions[sessionId] > SESSION_TTL) data['__sources__'][source].uv++;
    data['__sources__'][source].sessions[sessionId] = now;

    // Global device aggregation
    if (!data['__devices__']) data['__devices__'] = { mobile: 0, desktop: 0 };
    if (isMobile) data['__devices__'].mobile++; else data['__devices__'].desktop++;

    // Clean sessions
    for (const k of ['__total__']) {
      const o = data[k]; if (!o?.sessions) continue;
      for (const sid of Object.keys(o.sessions)) { if (now - o.sessions[sid] > SESSION_TTL) delete o.sessions[sid]; }
    }

    writePV(data);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
