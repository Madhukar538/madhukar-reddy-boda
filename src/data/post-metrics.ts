/**
 * One headline result per post, shown as a "run log" line on post cards so the
 * evidence is visible before the click. Keyed by slug; posts without one show none.
 */
export const postMetrics: Record<string, { value: string; label: string }> = {
  'herdr-ai-agent-team-claude-code-antigravity-copilot-codex': { value: '9 agents', label: 'one lead, two reviewers' },
  'why-i-am-an-agentic-developer': { value: '105 / 166', label: 'commits made with an agent' },
  'building-ai-email-assistant-with-a-team-of-coding-agents': { value: '260 PD → 2 days', label: 'to a working foundation' },
  'migrating-worker-services-to-dotnet-10-with-skills-and-coding-agents': { value: '2 days', label: '.NET 10, every platform' },
  'rtx-5090-vs-dgx-spark-local-llm-inference': { value: '15 s vs 41 s', label: 'same model, same request' },
  'ai-development-workflow-obsidian-mcp-skills': { value: '25 s → <1 s', label: 'blocking time, measured' },
  'mcp-server-code-database-intelligence': { value: '40+ tools', label: 'C# and SQL Server, via MCP' },
  'rag-chatbot-latency-audit': { value: '40 s → 13 s', label: 'typical answer time' },
  'hybrid-search-solr-bm25-vector-rrf': { value: 'BM25 + kNN', label: 'fused with RRF' },
  'nextjs-dotnet-on-demand-isr': { value: '0 API calls', label: 'per page view' },
  'dotnet-performance-tuning-api-throughput': { value: '−40%', label: 'latency' },
};
