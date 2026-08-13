import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = '/home/admin/opticskit/articles';
const INDEX_PATH = path.join(ARTICLES_DIR, 'index.json');
const PV_FILE = '/home/admin/opticskit/data/pageviews.json';

const SOURCE_LABELS: Record<string, string> = {
  direct: '🌐 直接访问', baidu: '🔍 百度搜索', google: '🌍 Google',
  bing: '🎯 Bing', wechat: '💬 微信', zhihu: '📚 知乎',
  bilibili: '📺 B站', internal: '🔗 站内跳转', other: '🔗 其他外部',
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = parseInt(url.searchParams.get('range') || '7');

  try {
    const articles = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

    let communityPosts = 0;
    try {
      const dbPath = '/home/admin/opticskit/data/posts.json';
      if (fs.existsSync(dbPath)) communityPosts = JSON.parse(fs.readFileSync(dbPath, 'utf-8')).length || 0;
    } catch {}

    let lastDeploy = '未知';
    try {
      const stat = fs.statSync('/home/admin/opticskit/.next/BUILD_ID');
      lastDeploy = stat.mtime.toISOString().slice(0, 16).replace('T', ' ');
    } catch {}

    // --- PV data ---
    let pvTotal = { pv: 0, uv: 0 };
    let todayPV = 0, todayUV = 0;
    let yesterdayPV = 0, yesterdayUV = 0;
    let pvPages: any[] = [];
    let dailyTrend: any[] = [];
    let sources: any[] = [];
    let devices = { mobile: 0, desktop: 0 };
    let toolRanking: any[] = [];
    let bounceRate = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    try {
      if (fs.existsSync(PV_FILE)) {
        const raw = JSON.parse(fs.readFileSync(PV_FILE, 'utf-8'));

        // Total
        const total = raw['__total__'];
        if (total) pvTotal = { pv: total.pv || 0, uv: total.uv || 0 };

        // Daily trend (based on range)
        const globalDaily = raw['__daily__'] || {};
        const dates = Object.keys(globalDaily).sort();
        const lastN = range === 9999 ? dates : dates.slice(-Math.max(1, range));
        dailyTrend = lastN.map(d => {
          const dd = globalDaily[d];
          return { date: d, pv: dd.pv || 0, uv: dd.uv || 0 };
        });

        // Today & Yesterday
        const td = globalDaily[today];
        if (td) { todayPV = td.pv || 0; todayUV = td.uv || 0; }
        const yd = globalDaily[yesterday];
        if (yd) { yesterdayPV = yd.pv || 0; yesterdayUV = yd.uv || 0; }

        // Aggregate sources & devices across the selected range
        const seenSourceUVs = new Map<string, Set<string>>();
        const seenDeviceUVs = { mobile: new Set<string>(), desktop: new Set<string>() };
        let totalVisitsInRange = 0;
        let singlePageVisits = 0;

        for (const d of lastN) {
          const dayData = globalDaily[d];
          if (!dayData) continue;

          // Aggregate sources
          const daySources = dayData.sources || {};
          for (const [src, sdata] of Object.entries(daySources) as [string, any][]) {
            if (!seenSourceUVs.has(src)) seenSourceUVs.set(src, new Set());
            const sessions = sdata.sessions || {};
            for (const sid of Object.keys(sessions)) {
              seenSourceUVs.get(src)!.add(sid);
            }
          }

          // Aggregate devices (UV-based)
          const dayDevices = dayData.devices || {};
          const devSessions = dayData.sessions || {};
          const mobileUV = new Set<string>();
          const desktopUV = new Set<string>();
          // Devices are PV-based in raw data; approximate UV by using sessions
          if (dayDevices.mobile > 0 && dayDevices.desktop > 0) {
            // Distribute sessions proportionally
            const total = dayDevices.mobile + dayDevices.desktop;
            const sessionIds = Object.keys(devSessions);
            const mobileRatio = dayDevices.mobile / total;
            const splitIdx = Math.round(sessionIds.length * mobileRatio);
            for (let i = 0; i < splitIdx; i++) seenDeviceUVs.mobile.add(sessionIds[i]);
            for (let i = splitIdx; i < sessionIds.length; i++) seenDeviceUVs.desktop.add(sessionIds[i]);
          } else if (dayDevices.mobile > 0) {
            for (const sid of Object.keys(devSessions)) seenDeviceUVs.mobile.add(sid);
          } else if (dayDevices.desktop > 0) {
            for (const sid of Object.keys(devSessions)) seenDeviceUVs.desktop.add(sid);
          }
        }

        // Build sources array
        const srcPVMap = new Map<string, number>();
        for (const d of lastN) {
          const daySources = globalDaily[d]?.sources || {};
          for (const [src, sdata] of Object.entries(daySources) as [string, any][]) {
            srcPVMap.set(src, (srcPVMap.get(src) || 0) + (sdata.pv || 0));
          }
        }
        sources = Array.from(seenSourceUVs.entries())
          .map(([src, uvs]) => ({
            source: src,
            label: SOURCE_LABELS[src] || src,
            pv: srcPVMap.get(src) || 0,
            uv: uvs.size,
          }))
          .sort((a, b) => b.pv - a.pv);

        devices = {
          mobile: seenDeviceUVs.mobile.size,
          desktop: seenDeviceUVs.desktop.size,
        };

        // Pages (global, for page ranking)
        pvPages = Object.entries(raw)
          .filter(([k]) => !k.startsWith('__'))
          .map(([p, d]: [string, any]) => ({ path: p, pv: d.pv || 0, uv: d.uv || 0 }))
          .sort((a, b) => b.pv - a.pv);

        // Tool ranking
        toolRanking = pvPages
          .filter(p => p.path.startsWith('/tools/'))
          .map(p => ({ tool: p.path.replace('/tools/', ''), pv: p.pv, uv: p.uv }))
          .sort((a, b) => b.pv - a.pv);

        // Bounce rate (single-page visits / total visits, today's data)
        if (td?.sessions) {
          const todaySessions = new Set(Object.keys(td.sessions));
          totalVisitsInRange = todaySessions.size;
          // Count pages with only 1 session today
          let singlePageSessionCount = 0;
          for (const [k, v] of Object.entries(raw) as [string, any][]) {
            if (k.startsWith('__')) continue;
            const pageDaily = v.daily?.[today];
            if (pageDaily?.sessions) {
              for (const sid of Object.keys(pageDaily.sessions)) {
                if (todaySessions.has(sid)) {
                  singlePageSessionCount++;
                  break; // at least one page visited by this session
                }
              }
            }
          }
          if (totalVisitsInRange > 0) {
            const multiPageSessions = new Set<string>();
            for (const [k, v] of Object.entries(raw) as [string, any][]) {
              if (k.startsWith('__')) continue;
              const pageDaily = v.daily?.[today];
              if (pageDaily?.sessions) {
                for (const sid of Object.keys(pageDaily.sessions)) {
                  if (todaySessions.has(sid)) multiPageSessions.add(sid);
                }
              }
            }
            // True bounce: sessions that visited exactly 1 page
            const sessionPageCounts = new Map<string, number>();
            for (const [k, v] of Object.entries(raw) as [string, any][]) {
              if (k.startsWith('__')) continue;
              const pageDaily = v.daily?.[today];
              if (pageDaily?.sessions) {
                for (const sid of Object.keys(pageDaily.sessions)) {
                  if (todaySessions.has(sid)) {
                    sessionPageCounts.set(sid, (sessionPageCounts.get(sid) || 0) + 1);
                  }
                }
              }
            }
            let bouncedCount = 0;
            for (const [sid, count] of sessionPageCounts) {
              if (count === 1) bouncedCount++;
            }
            bounceRate = Math.round((bouncedCount / totalVisitsInRange) * 100);
          }
        }
      }
    } catch {}

    // Count tools
    let toolsCount = 0;
    try {
      const toolsDir = '/home/admin/opticskit/src/app/tools';
      if (fs.existsSync(toolsDir)) {
        toolsCount = fs.readdirSync(toolsDir).filter(d => {
          const p = path.join(toolsDir, d);
          return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'page.tsx'));
        }).length;
      }
    } catch {}
    if (!toolsCount) toolsCount = 17;

    // Tool ranking with URLs
    const toolRankingWithUrls = toolRanking.map(t => ({
      ...t,
      url: `/tools/${t.tool}`,
    }));
    
    return NextResponse.json({
      range,
      articlesCount: articles.length,
      toolsCount,
      communityPosts,
      lastDeploy,
      pv: pvTotal,
      today: { pv: todayPV, uv: todayUV },
      yesterday: { pv: yesterdayPV, uv: yesterdayUV },
      dailyTrend,
      sources,
      devices,
      toolRanking: toolRankingWithUrls,
      pvPages,
      bounceRate,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
