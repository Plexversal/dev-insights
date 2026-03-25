import { useState, useRef } from 'react';

interface AdminPanelProps {
  onClose: () => void;
}

const PRESETS: { label: string; code: string }[] = [
  {
    label: 'latest post',
    code: `const posts = await redis.zRange('global_posts', 0, 0, { by: 'rank', reverse: true });
if (posts.length === 0) return 'No posts found';
const data = await redis.hGetAll('post_data:' + posts[0].member);
const plMatch = data.permalink?.match(/\\/r\\/([^/]+)/);
return JSON.stringify({
  id: data.id,
  title: data.title,
  author: data.authorName,
  subredditName: data.subredditName || 'NOT_SET',
  permalink_subreddit: plMatch ? plMatch[1] : 'UNKNOWN',
  permalink: data.permalink,
  timestamp: new Date(Number(data.timestamp)).toISOString(),
  expected_subreddit: context.subredditName,
  match: (plMatch?.[1]?.toLowerCase() === context.subredditName.toLowerCase()) ? 'OK' : 'MISMATCH'
}, null, 2);`,
  },
  {
    label: 'context',
    code: `return JSON.stringify(context, null, 2);`,
  },
  {
    label: 'cross-sub audit',
    code: `const posts = await redis.zRange('global_posts', 0, -1, { by: 'rank', reverse: true });
const results = [];
for (const p of posts) {
  const data = await redis.hGetAll('post_data:' + p.member);
  const plMatch = data.permalink?.match(/\\/r\\/([^/]+)/);
  const plSub = plMatch ? plMatch[1] : 'UNKNOWN';
  if (plSub.toLowerCase() !== context.subredditName.toLowerCase()) {
    results.push({ id: p.member, permalink_sub: plSub, stored_sub: data.subredditName || 'NOT_SET', title: (data.title || '').substring(0, 60) });
  }
}
return results.length === 0 ? 'No cross-subreddit posts found' : JSON.stringify(results, null, 2);`,
  },
  {
    label: 'post count',
    code: `const count = await redis.zCard('global_posts');
return 'Total posts in Redis: ' + count;`,
  },
  {
    label: 'comment count',
    code: `const count = await redis.zCard('global_comments');
return 'Total comments in Redis: ' + count;`,
  },
  {
    label: 'get post by id',
    code: `let post = await reddit.getPostById('t3_POSTID');
return JSON.stringify({ id: post.id, title: post.title, author: post.authorName, subreddit: post.subredditName }, null, 2);`,
  },
  {
    label: 'node version',
    code: `return process.version + ' | platform: ' + process.platform + ' | arch: ' + process.arch;`,
  },
];

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [code, setCode] = useState(PRESETS[0]!.code);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  const outputText = result ?? error ?? '';

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      if (outputRef.current) {
        const range = document.createRange();
        range.selectNodeContents(outputRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const handleEval = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setResult(typeof data.result === 'object' ? JSON.stringify(data.result, null, 2) : String(data.result));
      } else {
        setError(data.message + (data.stack ? '\n' + data.stack : ''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#111',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        zIndex: 9999,
        fontFamily: 'monospace',
        userSelect: 'text',
        WebkitUserSelect: 'text',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold m-0">Admin Panel</h2>
        <button
          onClick={onClose}
          className="bg-transparent border border-gray-500 text-white px-3 py-1 rounded cursor-pointer text-sm hover:bg-gray-700"
        >
          Close
        </button>
      </div>

      <div className="flex gap-1 flex-wrap mb-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setCode(p.code)}
            className="bg-transparent border border-gray-600 text-gray-300 px-2 py-0.5 rounded cursor-pointer text-[11px] whitespace-nowrap hover:bg-gray-700"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter code to eval... (reddit, redis, context are available)"
        spellCheck={false}
        className="min-h-[120px] bg-[#1a1a2e] text-gray-200 border border-gray-700 rounded-md p-3 text-[13px] font-mono resize-y outline-none leading-relaxed"
      />

      <button
        onClick={handleEval}
        disabled={loading || !code.trim()}
        className="mt-2.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white border-none rounded-md cursor-pointer disabled:cursor-not-allowed text-sm font-bold"
      >
        {loading ? 'Executing...' : 'Execute'}
      </button>

      <div className="flex-1 mt-3 overflow-auto bg-[#0d0d1a] border border-gray-700 rounded-md p-3 relative">
        <div className="flex justify-between items-center mb-1.5">
          <p className="m-0 text-xs text-gray-500">Output:</p>
          {outputText && (
            <button
              onClick={handleCopy}
              className={`border border-gray-600 px-2.5 py-0.5 rounded cursor-pointer text-[11px] transition-all ${
                copied ? 'bg-green-800 text-green-200' : 'bg-transparent text-gray-400 hover:bg-gray-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {result !== null && (
          <pre
            ref={outputRef}
            className="m-0 whitespace-pre-wrap break-all text-[#4ec9b0] text-[13px] select-text cursor-text"
          >
            {result}
          </pre>
        )}
        {error !== null && (
          <pre
            ref={error !== null && result === null ? outputRef : undefined}
            className="m-0 whitespace-pre-wrap break-all text-red-400 text-[13px] select-text cursor-text"
          >
            {error}
          </pre>
        )}
        {result === null && error === null && (
          <p className="m-0 text-gray-600 text-[13px]">No output yet. Enter code and click Execute.</p>
        )}
      </div>
    </div>
  );
}
