'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ANIMALS = ['🦊', '🐧', '🐙', '🐻', '🐹', '🐰', '🦁', '🐶', '🐱', '🐼', '🦄', '🐨', '🐯', '🐮', '🐷', '🐸'];

interface Post {
  id: string;
  content: string;
  tag: 'suggestion' | 'bug' | 'discussion';
  author_name: string;
  avatar: string;
  is_pinned: number;
  is_official: number;
  created_at: string;
  votes_count: number;
  replies_count: number;
}

interface Reply {
  id: string;
  post_id: string;
  content: string;
  author_name: string;
  avatar: string | null;
  is_official: number;
  created_at: string;
}

function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  let fp = localStorage.getItem('opticskit_fp');
  if (!fp) {
    fp = 'fp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    localStorage.setItem('opticskit_fp', fp);
  }
  return fp;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z').getTime();
  const diff = now - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 个月前`;
}

const tagLabels: Record<string, string> = {
  suggestion: '💡 功能建议',
  bug: '🐛 Bug 报告',
  discussion: '💬 技术讨论',
};

export default function CommunityPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  const [sort, setSort] = useState<'hot' | 'new'>('new');
  const [tagFilter, setTagFilter] = useState('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('suggestion');
  const [replyAsAdmin, setReplyAsAdmin] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [filterWarning, setFilterWarning] = useState('');
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({ all: 0, suggestion: 0, bug: 0, discussion: 0 });

  // Check URL hash for admin access (on load + on hash change)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setShowLogin(true);
      }
    };
    checkHash(); // check on mount
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const fingerprint = typeof window !== 'undefined' ? getFingerprint() : '';

  // Footer click to reveal admin login
  const handleFooterClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5 && !isAdmin) {
        setShowLogin(true);
        return 0;
      }
      return next;
    });
    // Reset after 3s
    setTimeout(() => setLogoClicks(0), 3000);
  }, [isAdmin]);

  // Fetch posts
  const fetchPosts = useCallback(async (append = false) => {
    const offset = append ? posts.length : 0;
    const params = new URLSearchParams({ sort, tag: tagFilter, limit: String(PAGE_SIZE), offset: String(offset) });
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (append) setLoadingMore(true);
    const res = await fetch(`/api/community?${params}`);
    const data = await res.json();
    const batch: Post[] = data.posts || [];
    if (append) {
      setPosts(prev => [...prev, ...batch]);
    } else {
      setPosts(batch);
      if (!append) {
        const idsWithReplies = batch.filter(p => p.replies_count > 0).map(p => p.id);
        setExpandedReplies(new Set(idsWithReplies));
        idsWithReplies.forEach(async (pid) => {
          const rRes = await fetch(`/api/community/replies?post_id=${pid}`);
          const rData = await rRes.json();
          setRepliesMap(prev => ({ ...prev, [pid]: rData.replies || [] }));
        });
      }
    }
    setHasMore(batch.length >= PAGE_SIZE);
    setLoadingMore(false);
    if (!append && data.counts) setTagCounts(data.counts);
  }, [sort, tagFilter, searchQuery, posts.length]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Fetch user votes
  useEffect(() => {
    if (!fingerprint) return;
    fetch(`/api/community/votes?fingerprint=${fingerprint}`)
      .then(r => r.json())
      .then(d => setVotedPosts(new Set(d.voted_ids || [])));
  }, [fingerprint]);

  // Admin login
  const handleLogin = async () => {
    const res = await fetch('/api/community/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });
    if (res.ok) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginError('');
    } else {
      setLoginError('密码错误');
      setAdminPassword('');
    }
  };

  // Create post
  const handlePost = async () => {
    const content = newPostContent.trim();
    if (!content || posting) return;
    if (content.length > 500) {
      setFilterWarning('内容超过500字');
      return;
    }
    setPosting(true);
    setFilterWarning('');

    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        tag: newPostTag,
        is_official: isAdmin && replyAsAdmin,
        author_name: isAdmin && replyAsAdmin ? 'OpticsKit' : undefined,
      }),
    });

    if (res.ok) {
      setNewPostContent('');
      fetchPosts();
    } else {
      const data = await res.json();
      setFilterWarning(data.error || '发布失败');
    }
    setPosting(false);
  };

  // Toggle vote
  const handleVote = async (postId: string) => {
    const res = await fetch('/api/community/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, fingerprint }),
    });
    const data = await res.json();
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, votes_count: data.votes_count } : p));
    setVotedPosts(prev => {
      const next = new Set(prev);
      data.voted ? next.add(postId) : next.delete(postId);
      return next;
    });
  };

  // Toggle replies
  const toggleReplies = async (postId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Load replies if not yet
      if (!repliesMap[postId]) {
        const res = await fetch(`/api/community/replies?post_id=${postId}`);
        const data = await res.json();
        setRepliesMap(prev => ({ ...prev, [postId]: data.replies || [] }));
      }
    }
    setExpandedReplies(newExpanded);
  };

  // Create reply
  const handleReply = async (postId: string) => {
    const content = (replyContents[postId] || '').trim();
    if (!content || replySubmitting.has(postId)) return;
    setReplySubmitting(prev => new Set(prev).add(postId));
    const res = await fetch('/api/community/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        content,
        is_official: isAdmin && replyAsAdmin,
        author_name: isAdmin && replyAsAdmin ? 'OpticsKit' : undefined,
      }),
    });
    if (res.ok) {
      setReplyContents(prev => ({ ...prev, [postId]: '' }));
      // Refresh replies
      const rRes = await fetch(`/api/community/replies?post_id=${postId}`);
      const data = await rRes.json();
      setRepliesMap(prev => ({ ...prev, [postId]: data.replies || [] }));
    }
    setReplySubmitting(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };


  // Admin: delete reply
  const handleDeleteReply = async (replyId: string, postId: string) => {
    if (!confirm("确定删除这条回复吗？此操作不可恢复。")) return;
    await fetch('/api/community/replies?id=' + replyId, { method: 'DELETE' });
    const rRes = await fetch('/api/community/replies?post_id=' + postId);
    const data = await rRes.json();
    setRepliesMap(prev => ({ ...prev, [postId]: data.replies || [] }));
    fetchPosts();
  };

  // Admin actions
  const handlePin = async (postId: string) => {
    await fetch(`/api/community?id=${postId}`, { method: 'PATCH' });
    fetchPosts();
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('确定删除这条留言吗？此操作不可恢复。')) return;
    await fetch(`/api/community?id=${postId}`, { method: 'DELETE' });
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      <main className="max-w-[720px] mx-auto px-5 py-8 pb-20">
        <h1 className="text-[22px] font-bold mb-1">💬 留言区</h1>
        <p className="text-[13px] text-[#6B7280] mb-4 leading-relaxed">
          匿名留言，畅所欲言。Bug 反馈、功能建议、光学技术讨论都可以。
        </p>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索留言..."
            className="w-full h-10 px-4 rounded-xl border border-[#E5E7EB] text-sm outline-none bg-white focus:border-[#2563EB] transition-colors"
          />
        </div>

        {/* Admin login (hidden) */}
        {showLogin && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="输入管理密码"
              className="w-[140px] h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#2563EB] bg-white"
            />
            <button onClick={handleLogin} className="h-9 px-3 rounded-lg border border-[#2563EB] bg-[#2563EB] text-white text-xs cursor-pointer font-medium">
              验证
            </button>
            {loginError && <span className="text-xs text-[#FA5252]">密码错误</span>}
          </div>
        )}

        {/* Admin toggle (after login) */}
        {isAdmin && (
          <div className="mb-4">
            <button
              onClick={() => { setIsAdmin(false); window.history.replaceState(null, '', window.location.pathname); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#111827] text-white text-xs cursor-pointer border-none"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD43B]" />
              管理员模式 · 已认证（点击退出）
            </button>
            <label className="ml-3 text-xs text-[#2563EB] cursor-pointer select-none">
              <input type="checkbox" checked={replyAsAdmin} onChange={e => setReplyAsAdmin(e.target.checked)} className="mr-1" />
              以官方身份发布
            </label>
          </div>
        )}

        {/* Post Box */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 shadow-sm">
          <textarea
            value={newPostContent}
            onChange={e => { setNewPostContent(e.target.value); setFilterWarning(''); }}
            placeholder="有什么想说的？Bug、建议、或者单纯聊聊天..."
            rows={2}
            maxLength={500}
            className="w-full min-h-[76px] border border-[#E5E7EB] rounded-[10px] p-3 text-sm font-sans text-[#111827] resize-y outline-none bg-[#F9FAFB] focus:border-[#2563EB] focus:bg-white transition-colors"
          />
          {filterWarning && (
            <p className="text-[11px] text-[#FA5252] mt-1.5">⚠️ {filterWarning}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1.5">
                {(['suggestion', 'bug', 'discussion'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setNewPostTag(t)}
                    className={`px-3 py-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                      newPostTag === t
                        ? 'border-[#2563EB] bg-[rgba(34,139,230,0.06)] text-[#2563EB] font-semibold'
                        : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#9CA3AF]'
                    }`}
                  >
                    {tagLabels[t]}
                  </button>
                ))}
              </div>
              <span className={`text-[11px] ${newPostContent.length > 500 ? 'text-[#FF6B6B]' : 'text-[#9CA3AF]'}`}>
                {newPostContent.length}/500
              </span>
            </div>
            <button
              onClick={handlePost}
              disabled={posting || !newPostContent.trim()}
              className="px-5 py-2 rounded-[20px] border-none bg-[#2563EB] text-white text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#1C7ED6] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? '发布中...' : '发布'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#9CA3AF] text-center mb-5">
          还是想私密反馈？<a href="mailto:techoptical@163.com" className="text-[#2563EB] no-underline hover:underline">点这里发送邮件给我们</a>
        </p>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          <button
            onClick={() => setSort('hot')}
            className={`px-3.5 py-2 rounded-2xl border text-xs cursor-pointer transition-all ${
              sort === 'hot' ? 'bg-[#2563EB] text-white border-[#2563EB] font-semibold' : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]'
            }`}
          >
            🔥 热门
          </button>
          <button
            onClick={() => setSort('new')}
            className={`px-3.5 py-2 rounded-2xl border text-xs cursor-pointer transition-all ${
              sort === 'new' ? 'bg-[#2563EB] text-white border-[#2563EB] font-semibold' : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]'
            }`}
          >
            🕐 最新
          </button>
          <div className="flex gap-1.5">
            {(['all', 'suggestion', 'bug', 'discussion'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`px-3 py-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                  tagFilter === t
                    ? 'bg-[rgba(34,139,230,0.08)] text-[#2563EB] border-[rgba(34,139,230,0.3)] font-semibold'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6] hover:text-[#4B5563]'
                }`}
              >
                {t === 'all' ? '全部' : tagLabels[t]}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tagFilter === t ? 'bg-[#2563EB] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}`}>{tagCounts[t] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-sm leading-relaxed">还没有留言，来做第一个发言的人吧！</p>
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className={`relative bg-white border rounded-xl p-[18px] mb-3 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${
                post.is_pinned ? 'border-l-[3px] border-l-[#2563EB] bg-[rgba(34,139,230,0.03)] ring-1 ring-[rgba(34,139,230,0.15)]' : 'border-[#E5E7EB]'
              }`}
            >
              {post.is_pinned ? <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,139,230,0.08)] text-[#2563EB] font-medium mr-1.5">📌 置顶</span> : null}

              {/* Admin actions */}
              {isAdmin && (
                <div className="absolute top-3.5 right-4 flex gap-1">
                  <button
                    onClick={() => handlePin(post.id)}
                    className={`px-2.5 py-[3px] rounded text-[10px] border cursor-pointer transition-all ${
                      post.is_pinned
                        ? 'text-[#2563EB] border-[rgba(34,139,230,0.3)] bg-[rgba(34,139,230,0.06)]'
                        : 'text-[#6B7280] border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
                    }`}
                  >
                    {post.is_pinned ? '📌 取消置顶' : '📌 置顶'}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-2.5 py-[3px] rounded text-[10px] text-[#6B7280] border border-[#E5E7EB] bg-white cursor-pointer hover:text-[#FA5252] hover:border-[rgba(250,82,82,0.3)] hover:bg-[rgba(250,82,82,0.04)] transition-all"
                  >
                    🗑 删除
                  </button>
                </div>
              )}

              {/* Header */}
              <div className={`flex items-center gap-2.5 mb-2.5 ${isAdmin ? "pr-28" : ""}`}>
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  post.is_official ? 'bg-gradient-to-br from-[#2563EB] to-[#1C7ED6] text-white' : 'bg-gradient-to-br from-[#E8F0FE] to-[#D2E3FC]'
                }`}>
                  {post.avatar === 'OPTICSKIT_LOGO' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/>
                    </svg>
                  ) : post.avatar}
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563]">{post.author_name}</span>
                {post.is_official ? <span className="text-[10px] px-1.5 py-px rounded bg-[#2563EB] text-white font-semibold">官方</span> : null}
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ml-2 ${
                  post.tag === 'suggestion' ? 'bg-[rgba(34,139,230,0.08)] text-[#2563EB] border border-[rgba(34,139,230,0.2)]' :
                  post.tag === 'bug' ? 'bg-[rgba(250,82,82,0.08)] text-[#FA5252] border border-[rgba(250,82,82,0.2)]' :
                  'bg-[rgba(255,183,77,0.08)] text-[#F59F00] border border-[rgba(255,183,77,0.2)]'
                }`}>
                  {tagLabels[post.tag]}
                </span>
                <span className="text-[11px] text-[#9CA3AF] ml-auto">{timeAgo(post.created_at)}</span>
              </div>

              {/* Body */}
              <p className="text-sm text-[#333] leading-[1.75] break-words">{post.content}</p>

              {/* Footer */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#F3F4F6]">
                <button
                  onClick={() => handleVote(post.id)}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs border border-transparent cursor-pointer transition-all hover:bg-[#F3F4F6] ${
                    votedPosts.has(post.id) ? 'text-[#2563EB] font-semibold bg-[rgba(34,139,230,0.06)]' : 'text-[#9CA3AF]'
                  }`}
                >
                  👍 {post.votes_count}
                </button>
                <button
                  onClick={() => toggleReplies(post.id)}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-md text-xs text-[#9CA3AF] border border-transparent cursor-pointer hover:bg-[#F3F4F6] hover:text-[#2563EB] transition-all"
                >
                  💬 回复{(post.replies_count ?? 0) > 0 ? ` (${post.replies_count})` : ''}
                </button>
              </div>

              {/* Replies */}
              {expandedReplies.has(post.id) && (
                <div className="mt-2.5">
                  {(repliesMap[post.id] || []).map(reply => (
                    <div key={reply.id} className={`p-2.5 rounded-lg mb-1.5 border-l-[3px] ${
                      reply.is_official ? 'bg-[rgba(34,139,230,0.04)] border border-[rgba(34,139,230,0.15)] border-l-[#2563EB]' : 'bg-[#F9FAFB] border-l-[#D1D5DB]'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-[#4B5563]">{reply.author_name}</span>
                        {reply.is_official ? <span className="text-[9px] px-1 py-px rounded bg-[#2563EB] text-white font-semibold">官方</span> : null}
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteReply(reply.id, post.id); }}
                            className="ml-auto text-[10px] text-[#9CA3AF] hover:text-[#FA5252] cursor-pointer border-none bg-transparent"
                            title="删除回复"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                      <p className="text-[13px] text-[#555] leading-[1.6]">{reply.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={replyContents[post.id] || ''}
                      onChange={e => setReplyContents(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleReply(post.id)}
                      placeholder="写下回复..."
                      className="flex-1 h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs outline-none bg-white focus:border-[#2563EB]"
                    />
                    <button
                      onClick={() => handleReply(post.id)}
                      disabled={replySubmitting.has(post.id)}
                      className="px-3.5 py-2 rounded-lg border-none bg-[#2563EB] text-white text-[11px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {replySubmitting.has(post.id) ? '回复中...' : '回复'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {hasMore && posts.length >= PAGE_SIZE && (
          <div className="text-center py-6">
            <button
              onClick={() => fetchPosts(true)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {loadingMore ? "加载中..." : "加载更多留言"}
            </button>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-[11px] text-[#D1D5DB] pt-4">—— 到底啦 ——</p>
        )}
      </main>

      <footer className="text-center py-6 text-[11px] text-[#D1D5DB] border-t border-[#E5E7EB] cursor-default select-none" onClick={handleFooterClick}>
        OpticsKit  · opticskit.cn
      </footer>
    </div>
  );
}
