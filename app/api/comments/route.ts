import fs from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';

// 评论存在站点代码之外，重新部署不会丢
const FILE = process.env.COMMENTS_FILE || '/var/lib/xhb/comments.json';

type Comment = {
  id: string;
  key: string;
  name: string;
  content: string;
  time: string;
};

type Store = Record<string, Comment[]>;

function readStore(): Store {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(store, null, 2), 'utf8');
}

// 简易限流：同一 IP 60 秒内最多 5 条
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

function clean(input: unknown, max: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') || '';
  if (!key) return Response.json({ ok: false, message: '缺少 key' }, { status: 400 });
  const store = readStore();
  return Response.json({ ok: true, comments: store[key] || [] });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: '格式错误' }, { status: 400 });
  }

  const key = clean(body?.key, 80);
  const name = clean(body?.name, 20) || '匿名';
  const content = clean(body?.content, 500);

  if (!key) return Response.json({ ok: false, message: '缺少 key' }, { status: 400 });
  if (!content) return Response.json({ ok: false, message: '内容不能为空' }, { status: 400 });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return Response.json({ ok: false, message: '发得太快了，歇一会儿' }, { status: 429 });
  }

  const store = readStore();
  const list = store[key] || [];
  const item: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key,
    name,
    content,
    time: new Date().toISOString(),
  };
  list.push(item);
  store[key] = list.slice(-500);
  writeStore(store);

  return Response.json({ ok: true, comment: item });
}
