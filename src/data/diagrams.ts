/**
 * Interactive architecture diagrams, keyed by blog post slug.
 * Rendered by components/portfolio/architecture-diagram.tsx.
 *
 * Coordinates are node centres in a 760-unit-wide viewBox.
 * A flow is a list of steps; each step is one or more edge ids travelled at
 * the same time (a leading "-" travels the edge backwards).
 */

export type NodeKind = 'client' | 'service' | 'ai' | 'data';

export type DiagramNode = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  kind: NodeKind;
  what: string;
  tech: string[];
  note?: string;
};

export type DiagramEdge = { id: string; from: string; to: string; twoWay?: boolean };

export type DiagramFlow = { id: string; label: string; steps: string[][] };

export type Diagram = {
  title: string;
  caption: string;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  flows: DiagramFlow[];
};

const hybridSearch: Diagram = {
  title: 'Hybrid search pipeline',
  caption: 'Follow one query through keyword and vector retrieval, fused with RRF.',
  height: 380,
  nodes: [
    { id: 'query', label: 'Query', sub: '"gold watch under 5k"', x: 80, y: 60, kind: 'client',
      what: 'The shopper’s raw text. Multi-item queries like “red card case and gold tone watch under 5000” are allowed.',
      tech: ['Next.js UI', 'Suggester autocomplete'] },
    { id: 'sku', label: 'SKU check', sub: 'exact code → #1', x: 230, y: 60, kind: 'service',
      what: 'If the query contains a product code such as “FS6121”, that product is forced to the top before any fuzzy matching runs.',
      tech: ['Regex', 'Solr elevation'] },
    { id: 'split', label: 'Clause split', sub: 'one intent per item', x: 380, y: 60, kind: 'service',
      what: 'Splits on commas and a standalone “and”, protecting “between X and Y” and “12,000”. Each clause runs the whole pipeline with its own filters, so one item’s category can’t starve another.',
      tech: ['C#'] },
    { id: 'nlu', label: 'NLU + price', sub: 'rules, no LLM', x: 530, y: 60, kind: 'service',
      what: 'Extracts brand, category, colour, size and price range using a live vocabulary refreshed from Solr facets every 5 minutes. Typos fall back to Solr’s fuzzy ~2 matching.',
      tech: ['Lexicon + regex', 'Solr facets', 'BackgroundService'],
      note: 'Deterministic and explainable, so there is no per-query model cost.' },
    { id: 'embed', label: 'Embed query', sub: 'ONNX, in-process', x: 680, y: 60, kind: 'ai',
      what: 'all-MiniLM-L6-v2 runs inside the .NET process and turns the query into a 384-dimension normalised vector. No network hop to an embedding API.',
      tech: ['ONNX Runtime', 'MiniLM', 'FastBertTokenizer'] },
    { id: 'bm25', label: 'BM25 search', sub: 'edismax + boosts', x: 380, y: 190, kind: 'data',
      what: 'Keyword relevance over name, description and rich product text, with phrase-proximity (pf2) and gentle business boosts for rating, sales and availability.',
      tech: ['Solr 9', 'edismax', 'synonyms.txt'] },
    { id: 'knn', label: 'Vector kNN', sub: 'dense vectors', x: 680, y: 190, kind: 'data',
      what: 'Solr’s native dense-vector search finds products whose precomputed embeddings are closest to the query, catching meaning that keywords miss.',
      tech: ['Solr 9 {!knn}', '384-dim vectors'] },
    { id: 'rrf', label: 'RRF fusion', sub: 'Σ 1/(60 + rank)', x: 530, y: 320, kind: 'service',
      what: 'Reciprocal Rank Fusion merges the two ranked lists using positions only, so BM25 scores and cosine similarities never need calibrating. Items ranked well by both rise to the top.',
      tech: ['K = 60'] },
    { id: 'dedup', label: 'De-duplicate', sub: 'style-level', x: 380, y: 320, kind: 'service',
      what: 'Collapses colour and size variants of the same style into one result and harvests their colour swatches with Solr collapse + expand.',
      tech: ['Solr collapse/expand'] },
    { id: 'results', label: 'Results', sub: 'paged, UI-ready', x: 230, y: 320, kind: 'client',
      what: 'Merged across clauses (best score wins), paged, and mapped to the storefront’s existing product view model.',
      tech: ['Response envelope'] },
  ],
  edges: [
    { id: 'e1', from: 'query', to: 'sku' },
    { id: 'e2', from: 'sku', to: 'split' },
    { id: 'e3', from: 'split', to: 'nlu' },
    { id: 'e4', from: 'nlu', to: 'embed' },
    { id: 'e5', from: 'nlu', to: 'bm25' },
    { id: 'e6', from: 'embed', to: 'knn' },
    { id: 'e7', from: 'bm25', to: 'rrf' },
    { id: 'e8', from: 'knn', to: 'rrf' },
    { id: 'e9', from: 'rrf', to: 'dedup' },
    { id: 'e10', from: 'dedup', to: 'results' },
  ],
  flows: [
    { id: 'search', label: 'Search request', steps: [['e1'], ['e2'], ['e3'], ['e4', 'e5'], ['e6'], ['e7', 'e8'], ['e9'], ['e10']] },
  ],
};

const ragChatbot: Diagram = {
  title: 'RAG chatbot architecture',
  caption: 'A chat request, and the background pipeline that feeds it documents.',
  height: 400,
  nodes: [
    { id: 'widget', label: 'Chat widget', sub: 'embeddable iframe', x: 80, y: 70, kind: 'client',
      what: 'A vanilla JS widget that any allowed domain can embed. The host origin is verified per tenant before a session starts.',
      tech: ['JavaScript', 'iframe', 'Allowed origins'] },
    { id: 'gateway', label: 'Gateway', sub: '.NET 10 + SignalR', x: 230, y: 70, kind: 'service',
      what: 'The non-blocking ASP.NET Core gateway: auth, tenant resolution and agent orchestration. Heavy work is pushed to background consumers.',
      tech: ['ASP.NET Core', 'SignalR', 'Redis backplane'] },
    { id: 'intent', label: 'Intent', sub: 'classify + guardrails', x: 380, y: 70, kind: 'ai',
      what: 'Classifies the question (docs, data, chit-chat) and applies safety and PII guardrails, ending early on unsafe intent.',
      tech: ['Semantic Kernel', 'PII masking'],
      note: 'The audit found later steps re-deriving this intent. Removing the duplicate is one of the planned fixes.' },
    { id: 'retrieval', label: 'Retrieval', sub: 'pgvector, per tenant', x: 530, y: 70, kind: 'data',
      what: 'Vector search over the tenant’s own document chunks. Collections are namespaced by tenant ID.',
      tech: ['PostgreSQL', 'pgvector'],
      note: 'The audit found this search running twice per request (about 300 ms). Searching once is a planned fix.' },
    { id: 'tools', label: 'Tools', sub: 'SQL agent + MCP', x: 680, y: 70, kind: 'ai',
      what: 'For data questions, a text-to-SQL agent queries whitelisted tables and columns; MCP servers expose extra tools per workspace.',
      tech: ['Text-to-SQL', 'MCP', 'Table whitelists'],
      note: 'Planned: collapse 4 sequential SQL LLM calls into one prompt with the schema inline, saving about 8–12 s.' },
    { id: 'memory', label: 'Memory', sub: 'mem0 episodic', x: 680, y: 200, kind: 'data',
      what: 'Long-term user context (preferences, earlier conversations) is recalled and added to the prompt.',
      tech: ['mem0', 'Qdrant', 'FastAPI'] },
    { id: 'answer', label: 'Answer', sub: 'LLM generation', x: 530, y: 200, kind: 'ai',
      what: 'The model writes the answer from the retrieved chunks, tool results and memory, citing sources.',
      tech: ['Self-hosted LLMs', 'Semantic Kernel'] },
    { id: 'stream', label: 'Stream', sub: 'tokens via SignalR', x: 80, y: 200, kind: 'service',
      what: 'Tokens are pushed to the widget as they are generated.',
      tech: ['SignalR'],
      note: 'The audit found an artificial 15 ms pause per 20-character chunk (about 1.5 s per answer). Forwarding tokens as they arrive is a planned fix.' },
    { id: 'upload', label: 'Upload', sub: 'files, URLs, crawls', x: 80, y: 330, kind: 'client',
      what: 'Admins add documents, URLs or crawl jobs from the Next.js portal.',
      tech: ['Next.js admin', 'Playwright crawler', 'Blob storage'] },
    { id: 'queue', label: 'Queue', sub: 'RabbitMQ', x: 230, y: 330, kind: 'service',
      what: 'Ingestion jobs are queued so the gateway never blocks on parsing or embedding.',
      tech: ['RabbitMQ'] },
    { id: 'consumer', label: 'Ingest', sub: 'chunk + embed', x: 380, y: 330, kind: 'ai',
      what: 'A background consumer parses, chunks and embeds each document.',
      tech: ['.NET worker', 'Embeddings'] },
    { id: 'store', label: 'Vector store', sub: 'per-tenant index', x: 530, y: 330, kind: 'data',
      what: 'Chunks and vectors land in the tenant’s pgvector collection, ready for retrieval.',
      tech: ['pgvector'] },
  ],
  edges: [
    { id: 'c1', from: 'widget', to: 'gateway' },
    { id: 'c2', from: 'gateway', to: 'intent' },
    { id: 'c3', from: 'intent', to: 'retrieval' },
    { id: 'c4', from: 'retrieval', to: 'tools' },
    { id: 'c5', from: 'tools', to: 'memory' },
    { id: 'c6', from: 'memory', to: 'answer' },
    { id: 'c7', from: 'answer', to: 'stream' },
    { id: 'c8', from: 'stream', to: 'widget' },
    { id: 'i1', from: 'upload', to: 'queue' },
    { id: 'i2', from: 'queue', to: 'consumer' },
    { id: 'i3', from: 'consumer', to: 'store' },
  ],
  flows: [
    { id: 'chat', label: 'Chat request', steps: [['c1'], ['c2'], ['c3'], ['c4'], ['c5'], ['c6'], ['c7'], ['c8']] },
    { id: 'ingest', label: 'Document ingestion', steps: [['i1'], ['i2'], ['i3']] },
  ],
};

const onDemandIsr: Diagram = {
  title: 'On-demand ISR flow',
  caption: 'How one content edit becomes exactly one backend fetch.',
  height: 380,
  nodes: [
    { id: 'editor', label: 'Editor', sub: 'saves content', x: 90, y: 70, kind: 'client',
      what: 'Someone edits a page in the CMS or admin backed by the .NET API.',
      tech: ['CMS / admin UI'] },
    { id: 'api', label: '.NET API', sub: 'ContentController', x: 270, y: 70, kind: 'service',
      what: 'Writes the change, then fires a signed webhook. Creates and deletes also flag listingChanged so navigation updates.',
      tech: ['ASP.NET Core', 'Fire-and-forget webhook'] },
    { id: 'webhook', label: 'Revalidate', sub: 'POST /api/revalidate', x: 450, y: 70, kind: 'service',
      what: 'A Next.js route checks the shared secret (401 otherwise) and expires only the affected tags.',
      tech: ['Next.js route handler', 'Shared secret'] },
    { id: 'tags', label: 'Cache tags', sub: 'page-{slug} expired', x: 640, y: 70, kind: 'data',
      what: 'revalidateTag(tag, { expire: 0 }) marks the cached data stale. Nothing is fetched yet.',
      tech: ['Next.js 16 cache', 'revalidateTag'],
      note: 'Next.js 16 requires the second argument; the one-argument form is deprecated.' },
    { id: 'visitor', label: 'Next visitor', sub: 'first after edit', x: 90, y: 220, kind: 'client',
      what: 'The first request after the edit pays for one live render.',
      tech: ['Browser'] },
    { id: 'next', label: 'Next.js', sub: 'App Router', x: 270, y: 220, kind: 'service',
      what: 'Sees the expired tag, fetches once from .NET, renders fresh HTML and re-caches it. Unknown slugs render on demand via dynamicParams.',
      tech: ['Next.js 16', 'dynamicParams'] },
    { id: 'html', label: 'Cached HTML', sub: 'static speed', x: 450, y: 220, kind: 'data',
      what: 'The fresh page is stored and served to everyone until the next edit.',
      tech: ['Full-route cache'] },
    { id: 'later', label: 'Everyone else', sub: 'zero API calls', x: 450, y: 330, kind: 'client',
      what: 'All later visitors get the cached HTML. In the POC, five requests added zero lines to the .NET log.',
      tech: ['Static HTML'] },
  ],
  edges: [
    { id: 'u1', from: 'editor', to: 'api' },
    { id: 'u2', from: 'api', to: 'webhook' },
    { id: 'u3', from: 'webhook', to: 'tags' },
    { id: 'v1', from: 'visitor', to: 'next' },
    { id: 'v2', from: 'next', to: 'api', twoWay: true },
    { id: 'v3', from: 'next', to: 'html' },
    { id: 'l1', from: 'later', to: 'html' },
  ],
  flows: [
    { id: 'edit', label: 'Editor saves', steps: [['u1'], ['u2'], ['u3']] },
    { id: 'first', label: 'Next visitor', steps: [['v1'], ['v2'], ['-v2'], ['v3']] },
    { id: 'later', label: 'Everyone after', steps: [['l1']] },
  ],
};

const runtimeWorkers: Diagram = {
  title: 'Dynamic background service manager',
  caption: 'Start, update and stop named workers by id while the app keeps running.',
  height: 320,
  nodes: [
    { id: 'cmd', label: 'Program.cs', sub: 'command loop', x: 90, y: 160, kind: 'client',
      what: 'Reads a line from the console, splits it on spaces and switches on START, STOP, UPDATE, LIST or EXIT, validating arguments before calling the manager.',
      tech: ['Console.ReadLine', 'switch'] },
    { id: 'mgr', label: 'ServiceManager', sub: 'one entry per id', x: 290, y: 160, kind: 'service',
      what: 'BackgroundServiceManager keeps every worker and its current config in a ConcurrentDictionary keyed by id, and starts each worker loop on the thread pool with Task.Run.',
      tech: ['ConcurrentDictionary', 'Task.Run'] },
    { id: 'wa', label: 'Worker "a"', sub: 'every 1000 ms', x: 500, y: 70, kind: 'service',
      what: 'A MyBackgroundService instance: an async loop that does its work, then awaits Task.Delay for its interval, until its CancellationTokenSource is cancelled.',
      tech: ['Task.Delay', 'CancellationTokenSource'] },
    { id: 'wb', label: 'Worker "b"', sub: 'every 5000 ms', x: 500, y: 250, kind: 'service',
      what: 'Same class, different settings. UpdateConfig swaps its ConfigData, and the loop reads the new interval and value on its next pass.',
      tech: ['ConfigData'] },
    { id: 'job', label: 'The work', sub: 'each tick', x: 680, y: 160, kind: 'data',
      what: 'What runs on every pass. In the demo it logs the config value; in a real app it could poll a queue, sync a cache or send a report.',
      tech: ['Your code'] },
  ],
  edges: [
    { id: 'c1', from: 'cmd', to: 'mgr' },
    { id: 'm1', from: 'mgr', to: 'wa' },
    { id: 'm2', from: 'mgr', to: 'wb' },
    { id: 'j1', from: 'wa', to: 'job' },
    { id: 'j2', from: 'wb', to: 'job' },
  ],
  flows: [
    { id: 'start', label: 'START', steps: [['c1'], ['m1'], ['j1']] },
    { id: 'update', label: 'UPDATE', steps: [['c1'], ['m2'], ['j2']] },
    { id: 'stop', label: 'STOP', steps: [['c1'], ['m1']] },
  ],
};

const codeIntelMcp: Diagram = {
  title: 'Code & database intelligence over MCP',
  caption: 'A scheduled sync builds the map; AI assistants query it through MCP tools.',
  height: 400,
  nodes: [
    { id: 'repos', label: 'Source repos', sub: 'C# solutions', x: 90, y: 70, kind: 'data',
      what: 'The workspace’s repositories. Each sync downloads every file for the configured branch into a temp directory created for that run.',
      tech: ['Git host REST API', 'Temp dir per run'] },
    { id: 'sqldb', label: 'SQL Server', sub: 'source database', x: 90, y: 250, kind: 'data',
      what: 'Tables, columns, keys, indexes and stored procedures, read from INFORMATION_SCHEMA and sys.* catalogue views.',
      tech: ['INFORMATION_SCHEMA', 'sys.foreign_keys', 'sys.indexes'] },
    { id: 'sync', label: 'Sync worker', sub: 'per workspace', x: 270, y: 160, kind: 'service',
      what: 'A BackgroundService that wakes every minute, picks workspaces that are due, and runs the pipeline in a fresh DI container holding that workspace’s credentials.',
      tech: ['BackgroundService', 'Isolated DI container'],
      note: 'State machine: Pending → Active → Pending, or Failed; Disabled pauses a workspace.' },
    { id: 'roslyn', label: 'Roslyn analyzer', sub: 'semantic model', x: 450, y: 70, kind: 'ai',
      what: 'Opens each solution with MSBuildWorkspace and extracts classes, methods, parameters, dependencies, stored procedures used, complexity and XML docs.',
      tech: ['Roslyn', 'MSBuildWorkspace', 'SemanticModel'] },
    { id: 'schema', label: 'Schema extractor', sub: 'catalogue views', x: 450, y: 250, kind: 'service',
      what: 'Turns the database catalogue into table and stored-procedure documents, including foreign keys and procedure parameters.',
      tech: ['ADO.NET', 'SQL'] },
    { id: 'mongo', label: 'MongoDB', sub: 'one db per workspace', x: 630, y: 160, kind: 'data',
      what: 'Classes (methods nested), method source, tables and stored procedures, written with idempotent bulk upserts.',
      tech: ['MongoDB', 'BulkWrite upserts'] },
    { id: 'mcp', label: 'MCP endpoint', sub: '/{workspace}/mcp', x: 450, y: 350, kind: 'service',
      what: 'JSON-RPC 2.0 over HTTP: initialize, tools/list and tools/call. The URL picks the workspace; a single executor maps 40+ tool names to handlers.',
      tech: ['MCP', 'JSON-RPC', 'SSE'] },
    { id: 'ai', label: 'AI assistant', sub: 'Claude, Copilot, Cursor', x: 150, y: 350, kind: 'client',
      what: 'Any MCP client. It discovers the tools, then calls small precise ones like search_stored_procedures or get_table_relationships instead of guessing.',
      tech: ['MCP client'] },
  ],
  edges: [
    { id: 's1', from: 'repos', to: 'sync' },
    { id: 's2', from: 'sqldb', to: 'sync' },
    { id: 's3', from: 'sync', to: 'roslyn' },
    { id: 's4', from: 'sync', to: 'schema' },
    { id: 's5', from: 'roslyn', to: 'mongo' },
    { id: 's6', from: 'schema', to: 'mongo' },
    { id: 'q1', from: 'ai', to: 'mcp', twoWay: true },
    { id: 'q2', from: 'mcp', to: 'mongo', twoWay: true },
  ],
  flows: [
    { id: 'sync', label: 'Scheduled sync', steps: [['s1', 's2'], ['s3', 's4'], ['s5', 's6']] },
    { id: 'ask', label: 'Assistant asks', steps: [['q1'], ['q2'], ['-q2'], ['-q1']] },
  ],
};

export const diagrams: Record<string, Diagram> = {
  'hybrid-search-solr-bm25-vector-rrf': hybridSearch,
  'rag-chatbot-latency-audit': ragChatbot,
  'nextjs-dotnet-on-demand-isr': onDemandIsr,
  'dotnet-dynamic-background-service-manager': runtimeWorkers,
  'mcp-server-code-database-intelligence': codeIntelMcp,
};
