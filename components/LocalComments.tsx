"use client";

import { useCallback, useEffect, useState } from 'react';

type Comment = {
  id: string;
  name: string;
  content: string;
  time: string;
};

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
  return new Date(iso).toLocaleDateString();
}

export default function LocalComments({ pageKey }: { pageKey: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?key=${encodeURIComponent(pageKey)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) setComments(data.comments || []);
    } catch {
      /* 网络异常就静默 */
    } finally {
      setLoaded(true);
    }
  }, [pageKey]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('comment_name') : '';
    if (saved) setName(saved);
    load();
  }, [load]);

  const submit = async () => {
    if (!content.trim() || busy) return;
    setBusy(true);
    setTip('');
    try {
      if (name.trim()) localStorage.setItem('comment_name', name.trim());
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: pageKey, name: name.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setContent('');
        setTip('✅ 留言成功');
        await load();
      } else {
        setTip(data.message || '发送失败');
      }
    } catch {
      setTip('网络异常，稍后再试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {comments.length} 条评论
        </span>
        <span className="text-xs text-slate-400">无需登录，留个称呼就行</span>
      </div>

      <div className="space-y-3 mb-4">
        {loaded && comments.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-3">来做第一个留言的人吧！</div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
              {(c.name || '匿').slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-indigo-500 dark:text-indigo-300">{c.name}</span>
                <span className="text-[11px] text-slate-400">{timeAgo(c.time)}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words mt-0.5">
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="称呼（可不填）"
          maxLength={20}
          className="w-full mb-2 px-3 py-2 text-sm rounded-lg bg-transparent border border-slate-200/60 dark:border-white/10 outline-none focus:border-indigo-400 text-slate-700 dark:text-slate-200"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么…"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg bg-transparent border border-slate-200/60 dark:border-white/10 outline-none focus:border-indigo-400 resize-none text-slate-700 dark:text-slate-200"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${tip.startsWith('✅') ? 'text-emerald-500' : 'text-rose-500'}`}>{tip}</span>
          <button
            onClick={submit}
            disabled={busy || !content.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold transition-colors"
          >
            {busy ? '发送中…' : '留言'}
          </button>
        </div>
      </div>
    </div>
  );
}
