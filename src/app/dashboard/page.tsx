'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// OpticsKit 全站数据面板
// 数据来源: Umami API (cloud.umami.is)
// ============================================================

const UMAMI_API = 'https://api.umami.is/v1/us';
const WEBSITE_ID = 'e5d4a374-05f1-43da-bf5a-466bb2e7b40b';

// 所有工具列表
const TOOLS = [
  { slug: 'diffraction', label: '🌊 衍射模拟' },
  { slug: 'camera-lens', label: '📷 相机镜头' },
  { slug: 'chromaticity', label: '🎨 色度分析' },
  { slug: 'lens', label: '🔍 透镜成像' },
  { slug: 'spectrum', label: '📊 光谱可视化' },
  { slug: 'laser', label: '⚡ 激光波长' },
  { slug: 'light-source', label: '💡 光源指标' },
  { slug: 'material-db', label: '🗄️ 材料数据库' },
  { slug: 'thin-film', label: '🎬 薄膜计算' },
  { slug: 'cauchy-fit', label: '📐 Cauchy拟合' },
];

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pageViews, setPageViews] = useState<any>(null);
  const [events, setEvents] = useState<any>(null);
  const [sources, setSources] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  // 检查 localStorage 中的 key
  useEffect(() => {
    const saved = localStorage.getItem('umami_key');
    if (saved) {
      setApiKey(saved);
      setConfigured(true);
    }
  }, []);

  const saveKey = () => {
    localStorage.setItem('umami_key', apiKey);
    setConfigured(true);
  };

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError('');

    const now = Date.now();
    const startAt = now - days * 24 * 60 * 60 * 1000;
    const headers = {
      'x-umami-api-key': apiKey,
      'Accept': 'application/json',
    };

    try {
      // 1. 总体统计
      const statsRes = await fetch(
        `${UMAMI_API}/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${now}`,
        { headers }
      );
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);
      else throw new Error(statsData.message || '获取统计数据失败');

      // 2. 页面访问量
      const pvRes = await fetch(
        `${UMAMI_API}/websites/${WEBSITE_ID}/metrics/expanded?startAt=${startAt}&endAt=${now}&type=path&limit=50`,
        { headers }
      );
      const pvData = await pvRes.json();
      if (pvRes.ok) setPageViews(pvData);

      // 3. 来源渠道
      const srcRes = await fetch(
        `${UMAMI_API}/websites/${WEBSITE_ID}/metrics/expanded?startAt=${startAt}&endAt=${now}&type=referrer&limit=20`,
        { headers }
      );
      const srcData = await srcRes.json();
      if (srcRes.ok) setSources(srcData);

      // 4. 事件数据
      const evtRes = await fetch(
        `${UMAMI_API}/websites/${WEBSITE_ID}/metrics/expanded?startAt=${startAt}&endAt=${now}&type=event&limit=100`,
        { headers }
      );
      const evtData = await evtRes.json();
      if (evtRes.ok) setEvents(evtData);

    } catch (e: any) {
      setError(e.message || '请求失败');
    } finally {
      setLoading(false);
    }
  }, [apiKey, days]);

  useEffect(() => {
    if (configured) fetchData();
  }, [configured, fetchData]);

  // Dashboard 本体
  if (!configured) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>📊 OpticsKit 全站数据面板</h1>
          <p style={styles.desc}>输入 Umami API Key 以查看数据</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Umami API Key"
              style={styles.input}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
            />
            <button onClick={saveKey} style={styles.btn}>确认</button>
          </div>
          <p style={{ fontSize: 12, color: '#86868b', marginTop: 12 }}>
            去 Umami 后台 → Settings → API keys → Create key 获取
          </p>
        </div>
      </div>
    );
  }

  // 工具 PV 解析
  const toolPVs: Record<string, number> = {};
  if (pageViews && Array.isArray(pageViews)) {
    pageViews.forEach((item: any) => {
      const path = item.name || '';
      const m = path.match(/\/tools\/([^/]+)/);
      if (m) {
        const slug = m[1];
        toolPVs[slug] = (toolPVs[slug] || 0) + (item.pageviews || 0);
      }
    });
  }

  // 事件统计
  const eventCounts: Record<string, number> = {};
  if (events && Array.isArray(events)) {
    events.forEach((item: any) => {
      const name = item.name || item.x || '';
      eventCounts[name] = (eventCounts[name] || 0) + (item.pageviews || item.y || 0);
    });
  }

  // 来源解析
  const sourceData: Array<{ name: string; pv: number; uv: number }> = [];
  if (sources && Array.isArray(sources)) {
    sourceData.push(...sources.map((s: any) => ({
      name: s.name || '(直接访问)',
      pv: s.pageviews || 0,
      uv: s.visitors || 0,
    })));
  }

  // 工具排名
  const toolRanking = TOOLS
    .map(t => ({ ...t, pv: toolPVs[t.slug] || (pageViews ? 0 : -1) }))
    .sort((a, b) => b.pv - a.pv);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 全站数据面板</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={styles.select}
        >
          <option value={1}>今天</option>
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
          <option value={90}>近 90 天</option>
        </select>
        <button onClick={fetchData} style={styles.btn} disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </button>
        <span style={{ fontSize: 12, color: '#86868b', marginLeft: 'auto' }}>
          data: cloud.umami.is
        </span>
      </div>

      {error && (
        <div style={styles.errorCard}>
          ⚠️ {error}
        </div>
      )}

      {/* 总体概览 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="总 PV" value={stats.pageviews?.toLocaleString()} />
          <StatCard label="UV" value={stats.visitors?.toLocaleString()} />
          <StatCard label="Visits" value={stats.visits?.toLocaleString()} />
          <StatCard label="弹跳率" value={`${stats.bounces ? Math.round(stats.bounces / stats.visits * 100) : 0}%`} />
          <StatCard label="平均停留" value={stats.totaltime ? `${Math.round(stats.totaltime / stats.visits | 0)}s` : '-'} />
        </div>
      )}

      {/* 工具排名 */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>🔧 工具 PV 排名</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>工具</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>PV</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>占比</th>
              <th style={styles.th}>趋势</th>
            </tr>
          </thead>
          <tbody>
            {toolRanking.map((t, i) => {
              const total = toolRanking.reduce((sum, x) => sum + Math.max(0, x.pv), 0);
              const pct = total > 0 && t.pv >= 0 ? ((t.pv / total) * 100).toFixed(1) : '-';
              const maxPV = toolRanking[0]?.pv || 1;
              const barWidth = total > 0 && t.pv >= 0 ? Math.round((t.pv / maxPV) * 100) : 0;
              return (
                <tr key={t.slug} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{t.label}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                    {t.pv >= 0 ? t.pv.toLocaleString() : '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{pct}%</td>
                  <td style={styles.td}>
                    <div style={{ background: '#0071e3', height: 4, borderRadius: 2, width: `${barWidth}%`, transition: 'width 0.3s' }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 来源渠道 */}
      {sourceData.length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h2 style={styles.subtitle}>📡 来源渠道</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>来源</th>
                <th style={{ ...styles.th, textAlign: 'right' as const }}>PV</th>
                <th style={{ ...styles.th, textAlign: 'right' as const }}>UV</th>
              </tr>
            </thead>
            <tbody>
              {sourceData.slice(0, 10).map((s, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{formatSource(s.name)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{s.pv.toLocaleString()}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{s.uv.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 关键事件 */}
      {Object.keys(eventCounts).length > 0 && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <h2 style={styles.subtitle}>🎯 关键行为事件</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>事件</th>
                <th style={{ ...styles.th, textAlign: 'right' as const }}>触发次数</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(eventCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 20)
                .map(([name, count], i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><code style={{ fontSize: 11 }}>{name}</code></td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{count.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function formatSource(name: string): string {
  if (!name || name === 'direct') return '🖥️ 直接访问';
  if (name.includes('weixin') || name.includes('wechat')) return '💬 微信';
  if (name.includes('baidu')) return '🔍 百度';
  if (name.includes('google')) return '🌐 Google';
  if (name.includes('bing')) return '🔎 Bing';
  if (name.length > 30) return name.substring(0, 28) + '...';
  return name;
}

// ============================================================
// Styles
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px 16px 64px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
    color: '#1d1d1f',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    marginBottom: 12,
    color: '#1d1d1f',
  },
  desc: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d2d2d7',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
  },
  btn: {
    padding: '10px 20px',
    background: '#0071e3',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d2d2d7',
    borderRadius: 10,
    fontSize: 14,
    background: 'white',
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statCard: {
    background: 'white',
    borderRadius: 14,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statLabel: {
    fontSize: 12,
    color: '#86868b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#86868b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e9ecef',
  },
  td: {
    padding: '10px 12px',
    fontSize: 14,
    borderBottom: '1px solid #f2f3f5',
  },
  tr: {
    // hover handled via nth-child
  },
  errorCard: {
    background: '#fff3f0',
    border: '1px solid #ffd4cc',
    borderRadius: 12,
    padding: '14px 18px',
    color: '#cc3300',
    fontSize: 14,
    marginBottom: 16,
  },
};
