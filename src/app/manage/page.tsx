'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    const res = await fetch('/api/community?sort=new');
    const data = await res.json();
    setPosts(data.posts || []);
  };

  useEffect(() => {
    if (loggedIn) fetchPosts();
  }, [loggedIn]);

  const handleLogin = async () => {
    const res = await fetch('/api/community/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
      setError('');
    } else {
      setError('密码错误');
    }
  };

  const handlePin = async (id: string) => {
    await fetch(`/api/community?id=${id}`, { method: 'PATCH' });
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/community?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const handleReply = async (postId: string, content: string) => {
    if (!content.trim()) return;
    await fetch('/api/community/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content, is_official: true }),
    });
    fetchPosts();
  };

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f3f5', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', width: 320 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>🔐 OpticsKit 管理后台</h2>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="输入管理密码"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #dee2e6', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
          />
          {error && <p style={{ color: '#fa5252', fontSize: 12, margin: '8px 0 0' }}>{error}</p>}
          <button
            onClick={handleLogin}
            style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8, border: 'none', background: '#228be6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  const tagLabels: Record<string, string> = {
    suggestion: '💡 功能建议',
    bug: '🐛 Bug 报告',
    discussion: '💬 技术讨论',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f3f5', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🔐 OpticsKit 管理后台</span>
        <button
          onClick={() => { setLoggedIn(false); setPassword(''); }}
          style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #dee2e6', background: '#fff', fontSize: 12, cursor: 'pointer' }}
        >
          退出登录
        </button>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>📋 留言管理</h2>
          <button
            onClick={fetchPosts}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #dee2e6', background: '#fff', fontSize: 12, cursor: 'pointer' }}
          >
            🔄 刷新
          </button>
        </div>

        <div style={{ marginBottom: 12, fontSize: 12, color: '#868e96' }}>
          共 {posts.length} 条留言
        </div>

        {posts.map(post => {
          const [replyText, setReplyText] = useState('');
          return (
            <div
              key={post.id}
              style={{
                background: '#fff',
                border: post.is_pinned ? '2px solid #228be6' : '1px solid #e9ecef',
                borderRadius: 12,
                padding: 18,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{post.avatar}</span>
                <strong style={{ fontSize: 13, color: '#495057' }}>{post.author_name}</strong>
                {post.is_official && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#228be6', color: '#fff' }}>官方</span>}
                {post.is_pinned && <span style={{ fontSize: 10, color: '#228be6' }}>📌 置顶</span>}
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f1f3f5', color: '#868e96' }}>{tagLabels[post.tag] || post.tag}</span>
                <span style={{ fontSize: 11, color: '#adb5bd', marginLeft: 'auto' }}>{post.created_at?.slice(0, 16).replace('T', ' ')}</span>
              </div>

              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.7, margin: '0 0 12px' }}>{post.content}</p>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#adb5bd' }}>👍 {post.votes_count}</span>
                <span style={{ fontSize: 12, color: '#adb5bd' }}>💬 {post.replies_count}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handlePin(post.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, border: '1px solid #dee2e6', background: '#fff',
                    fontSize: 11, cursor: 'pointer', color: post.is_pinned ? '#228be6' : '#868e96',
                  }}
                >
                  {post.is_pinned ? '取消置顶' : '📌 置顶'}
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, border: '1px solid #dee2e6', background: '#fff',
                    fontSize: 11, cursor: 'pointer', color: '#fa5252',
                  }}
                >
                  🗑 删除
                </button>
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { handleReply(post.id, replyText); setReplyText(''); } }}
                    placeholder="以官方身份回复..."
                    style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 12, outline: 'none' }}
                  />
                  <button
                    onClick={() => { handleReply(post.id, replyText); setReplyText(''); }}
                    style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#228be6', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    回复
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
