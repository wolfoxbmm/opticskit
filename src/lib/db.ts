// OpticsKit Community Database - JSON File Storage
// No native dependencies, no SQLite. Simple and reliable.
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const REPLIES_FILE = path.join(DATA_DIR, 'replies.json');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch {}
  return fallback;
}

function writeJSON(filePath: string, data: any) {
  ensureDir();
  fs.writeFileSync(filePath + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(filePath + '.tmp', filePath);
}

export interface Post {
  id: string;
  content: string;
  tag: string;
  author_name: string;
  avatar: string;
  is_pinned: boolean;
  is_official: boolean;
  created_at: string;
}

export interface Reply {
  id: string;
  post_id: string;
  content: string;
  author_name: string;
  avatar: string | null;
  is_official: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  post_id: string;
  fingerprint: string;
  created_at: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const ANIMALS = ['\U0001f98a', '\U0001f427', '\U0001f419', '\U0001f43b', '\U0001f439', '\U0001f430', '\U0001f981', '\U0001f436', '\U0001f431', '\U0001f43c', '\U0001f984', '\U0001f428', '\U0001f42f', '\U0001f42e', '\U0001f437', '\U0001f438'];

function randomAvatar(): string {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

function now(): string {
  return new Date().toISOString();
}

// ========== Posts ==========
export function getPosts(params: {
  sort?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): (Post & { votes_count: number; replies_count: number })[] {
  const posts = readJSON<Post[]>(POSTS_FILE, []);
  const replies = readJSON<Reply[]>(REPLIES_FILE, []);
  const votes = readJSON<Vote[]>(VOTES_FILE, []);

  let result = posts.map(p => ({
    ...p,
    votes_count: votes.filter(v => v.post_id === p.id).length,
    replies_count: replies.filter(r => r.post_id === p.id).length,
  }));

  if (params.tag && params.tag !== 'all') {
    result = result.filter(p => p.tag === params.tag);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(p => p.content.toLowerCase().includes(q));
  }

  const sortByHot = params.sort === 'new'
    ? (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    : (a: any, b: any) => (b.votes_count - a.votes_count) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  result.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return sortByHot(a, b);
  });

  const limit = params.limit || 50;
  const offset = params.offset || 0;
  return result.slice(offset, offset + limit);
}

export function createPost(data: {
  content: string;
  tag: string;
  author_name?: string;
  is_official?: boolean;
}): Post {
  const posts = readJSON<Post[]>(POSTS_FILE, []);
  const post: Post = {
    id: generateId(),
    content: data.content,
    tag: data.tag,
    author_name: data.author_name || (data.is_official ? 'OpticsKit' : '\u533f\u540d\u7528\u6237'),
    avatar: data.is_official ? 'OPTICSKIT_LOGO' : randomAvatar(),
    is_pinned: false,
    is_official: data.is_official || false,
    created_at: now(),
  };
  posts.push(post);
  writeJSON(POSTS_FILE, posts);
  return post;
}

export function deletePost(id: string): boolean {
  let posts = readJSON<Post[]>(POSTS_FILE, []);
  const before = posts.length;
  posts = posts.filter(p => p.id !== id);
  writeJSON(POSTS_FILE, posts);

  let replies = readJSON<Reply[]>(REPLIES_FILE, []);
  replies = replies.filter(r => r.post_id !== id);
  writeJSON(REPLIES_FILE, replies);

  let votes = readJSON<Vote[]>(VOTES_FILE, []);
  votes = votes.filter(v => v.post_id !== id);
  writeJSON(VOTES_FILE, votes);

  return posts.length < before;
}

export function togglePin(id: string): Post | null {
  const posts = readJSON<Post[]>(POSTS_FILE, []);
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  posts[idx].is_pinned = !posts[idx].is_pinned;
  writeJSON(POSTS_FILE, posts);
  return posts[idx];
}

// ========== Replies ==========
export function getReplies(postId: string): Reply[] {
  const replies = readJSON<Reply[]>(REPLIES_FILE, []);
  return replies.filter(r => r.post_id === postId).sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function createReply(data: {
  post_id: string;
  content: string;
  author_name?: string;
  is_official?: boolean;
}): Reply {
  const replies = readJSON<Reply[]>(REPLIES_FILE, []);
  const reply: Reply = {
    id: generateId(),
    post_id: data.post_id,
    content: data.content,
    author_name: data.author_name || (data.is_official ? 'OpticsKit' : '\u533f\u540d\u7528\u6237'),
    avatar: data.is_official ? 'OPTICSKIT_LOGO' : randomAvatar(),
    is_official: data.is_official || false,
    created_at: now(),
  };
  replies.push(reply);
  writeJSON(REPLIES_FILE, replies);
  return reply;
}

// Delete a single reply (admin only)
export function deleteReply(id: string): boolean {
  let replies = readJSON<Reply[]>(REPLIES_FILE, []);
  const before = replies.length;
  replies = replies.filter(r => r.id !== id);
  writeJSON(REPLIES_FILE, replies);
  return replies.length < before;
}

// ========== Votes ==========
export function toggleVote(postId: string, fingerprint: string): { voted: boolean; votes_count: number } {
  const votes = readJSON<Vote[]>(VOTES_FILE, []);
  const idx = votes.findIndex(v => v.post_id === postId && v.fingerprint === fingerprint);

  if (idx !== -1) {
    votes.splice(idx, 1);
    writeJSON(VOTES_FILE, votes);
    return { voted: false, votes_count: votes.filter(v => v.post_id === postId).length };
  } else {
    votes.push({
      id: generateId(),
      post_id: postId,
      fingerprint,
      created_at: now(),
    });
    writeJSON(VOTES_FILE, votes);
    return { voted: true, votes_count: votes.filter(v => v.post_id === postId).length };
  }
}

export function getUserVotes(fingerprint: string): string[] {
  const votes = readJSON<Vote[]>(VOTES_FILE, []);
  return votes.filter(v => v.fingerprint === fingerprint).map(v => v.post_id);
}
