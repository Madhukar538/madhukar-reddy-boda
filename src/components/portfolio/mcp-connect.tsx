'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Section } from './section';

const tools = [
  { name: 'get_profile', description: 'Summary, contact details and availability' },
  { name: 'get_experience', description: 'Current role, highlights and key contributions' },
  { name: 'get_skills', description: 'Tech stack by category, or check a single technology' },
  { name: 'list_projects', description: 'Key projects and Lab experiments, filterable' },
  { name: 'search_blog', description: 'Ranked keyword search over technical posts' },
  { name: 'list_blog_posts', description: 'Every post, newest first' },
  { name: 'get_blog_post', description: 'Full text of a post as Markdown' },
];

const examples = [
  'Has Madhukar built production RAG systems? Cite projects.',
  'Use the assess_fit prompt with this job description: …',
  'Summarise his blog post about hybrid search in 5 bullets.',
  'Does he know Redis and Kubernetes?',
];

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="glass-inset overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-foreground/10">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[hsl(var(--sys-green))]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs leading-relaxed overflow-x-auto text-foreground/85">{code}</pre>
    </div>
  );
}

let requestId = 0;
async function callMcp(method: string, params: Record<string, unknown>) {
  const res = await fetch('/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
  });
  return res.json();
}

export function McpConnect() {
  const [origin, setOrigin] = useState('https://your-domain');
  const [query, setQuery] = useState('vector search');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const endpoint = `${origin}/mcp`;

  const tryIt = async () => {
    setLoading(true);
    try {
      const response = await callMcp('tools/call', { name: 'search_blog', arguments: { query, limit: 3 } });
      const textContent = response?.result?.content?.[0]?.text;
      setResult(textContent ?? JSON.stringify(response, null, 2));
    } catch (err) {
      setResult(`Request failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Section id="connect" title="Connect" comment="Works with any MCP client">
        <div className="glass p-5 md:p-6 space-y-4">
          <p className="text-[15px] text-foreground/85">
            Endpoint: <code className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-sm text-primary">{endpoint}</code>{' '}
            <span className="text-muted-foreground">(Streamable HTTP · read-only · no auth)</span>
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <CopyBlock label="Claude Code" code={`claude mcp add --transport http madhukar ${endpoint}`} />
            <CopyBlock
              label="Claude (web & desktop)"
              code={`Settings → Connectors → Add custom connector\nURL: ${endpoint}`}
            />
            <CopyBlock
              label="Cursor · .cursor/mcp.json"
              code={JSON.stringify({ mcpServers: { madhukar: { url: endpoint } } }, null, 2)}
            />
            <CopyBlock
              label="VS Code · .vscode/mcp.json"
              code={JSON.stringify({ servers: { madhukar: { type: 'http', url: endpoint } } }, null, 2)}
            />
          </div>
        </div>
      </Section>

      <Section id="tools" title="What your AI can do" comment="7 tools · resources · 1 prompt">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="glass p-5 md:p-6">
            <p className="mb-3 text-sm font-semibold text-foreground">Tools</p>
            <ul className="space-y-2.5">
              {tools.map((t) => (
                <li key={t.name} className="flex flex-col">
                  <code className="text-sm font-semibold text-primary">{t.name}</code>
                  <span className="text-sm text-muted-foreground">{t.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass p-5 md:p-6 space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Prompt</p>
              <code className="text-sm font-semibold text-primary">assess_fit</code>
              <p className="text-sm text-muted-foreground">
                Paste a job description; your AI gathers evidence with the tools and reports matches and gaps.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Resources</p>
              <p className="text-sm text-muted-foreground">
                <code className="text-primary">portfolio://profile</code> and{' '}
                <code className="text-primary">portfolio://blog/&#123;slug&#125;</code>
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Try asking</p>
              <ul className="space-y-1.5">
                {examples.map((e) => (
                  <li key={e} className="text-sm text-foreground/80">“{e}”</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section id="try" title="Try it live" comment="Calls search_blog on this server">
        <div className="glass p-5 md:p-6 space-y-4">
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              tryIt();
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search query"
              className="glass-inset flex-1 px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. load testing"
            />
            <button type="submit" disabled={loading || !query.trim()} className={cn('tinted-button !px-5', loading && 'opacity-70')}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Call tool
            </button>
          </form>
          {result && (
            <pre className="glass-inset max-h-96 overflow-auto px-4 py-3 text-xs leading-relaxed text-foreground/85">{result}</pre>
          )}
        </div>
      </Section>
    </>
  );
}
