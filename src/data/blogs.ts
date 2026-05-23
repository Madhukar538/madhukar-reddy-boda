export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Rich HTML content
  date: string;
  readTime: string;
  category: string;
  tags: string[];
}

export const blogs: BlogPost[] = [
  {
    slug: "dotnet-performance-tuning-api-throughput",
    title: "Deep-Dive: .NET Core API Performance Tuning & Memory Optimization",
    excerpt: "Learn how we reduced latency by 40% and optimized GC pressure in high-throughput .NET Core microservices.",
    date: "May 20, 2026",
    readTime: "8 min read",
    category: "Software Architecture",
    tags: [".NET Core", "Performance", "GC Optimization", "APIs"],
    content: `
      <p class="lead">In high-throughput microservices, CPU utilization and Garbage Collector (GC) pauses are often the silent killers of low-latency SLAs. Recently, we undertook a migration and optimization effort on a core API endpoint handling over 15,000 requests per second. Here is the engineering breakdown of how we achieved a 40% reduction in response latency.</p>
      
      <h2>1. The Problem: Gen 0/1 GC Spikes</h2>
      <p>Through detailed memory profiling using dotnet-dump and PerfView, we identified that our primary bottleneck was GC collection pauses. Specifically, large amounts of short-lived objects were being allocated per request, causing frequent Generation 0 and Generation 1 Garbage Collections that paused thread execution.</p>
      
      <h2>2. The Fix: Structs, ArrayPool, and Span&lt;T&gt;</h2>
      <p>We systematically refactored the request pipeline to reduce heap allocations:</p>
      <ul>
        <li><strong>ArrayPool & MemoryPool:</strong> Instead of allocating new byte arrays for body deserialization on every request, we leased arrays from <code>ArrayPool&lt;byte&gt;.Shared</code> and returned them immediately after processing.</li>
        <li><strong>Span&lt;T&gt; and ReadOnlySpan&lt;T&gt;:</strong> We converted string slicing operations into zero-allocation spans. This prevented millions of string allocations per minute.</li>
        <li><strong>ValueTask:</strong> Asynchronous methods that frequently complete synchronously were changed from returning <code>Task&lt;T&gt;</code> to <code>ValueTask&lt;T&gt;</code>, eliminating Task object allocations.</li>
      </ul>

      <pre class="bg-black/40 p-4 rounded-xl text-xs overflow-x-auto text-emerald-400 border border-white/5">
// Zero-allocation parsing snippet
public ReadOnlySpan&lt;char&gt; ExtractToken(ReadOnlySpan&lt;char&gt; header) {
    int index = header.IndexOf("Bearer ");
    if (index == -1) return ReadOnlySpan&lt;char&gt;.Empty;
    return header.Slice(index + 7);
}</pre>

      <h2>3. Results and Metrics</h2>
      <p>After deploying these optimizations, load tests run via k6 showed a drop in p99 latency from 180ms to 42ms. Heap allocations per request dropped from 14KB to under 200 bytes. This not only improved user experience but also slashed our container resource requirements by half.</p>
    `
  },
  {
    slug: "load-testing-microservices-k6-grafana",
    title: "Designing Repeatable Load Testing Suites with k6 and Grafana",
    excerpt: "A guide to building a continuous load testing pipeline to detect latency regressions before code reaches staging.",
    date: "April 15, 2026",
    readTime: "6 min read",
    category: "Observability",
    tags: ["k6", "Grafana", "Load Testing", "DevOps"],
    content: `
      <p class="lead">Observability isn't just about production logs; it starts with proactive performance assertion. Setting up a repeatable load testing suite allows engineering teams to catch architectural bottlenecks before code goes live.</p>
      
      <h2>Why k6 for Modern API Platforms?</h2>
      <p>k6 stands out because it is developer-centric. Written in Go, it allows developers to write load test scripts in JavaScript, making it simple to version-control performance test cases right alongside the application codebase.</p>

      <h2>Integrating k6 with Grafana InfluxDB</h2>
      <p>To make the metrics digestible, we stream k6 test results directly to an InfluxDB instance, which is visualized in real-time on a customized Grafana dashboard. This provides instantaneous visual feedback on:</p>
      <ul>
        <li>Request Rates (RPS) and HTTP Failure Rates.</li>
        <li>Response Latency percentiles (p50, p95, p99).</li>
        <li>System utilization (Memory/CPU of the target services).</li>
      </ul>

      <pre class="bg-black/40 p-4 rounded-xl text-xs overflow-x-auto text-emerald-400 border border-white/5">
// Example k6 test scenario script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 users
    { duration: '1m', target: 100 },  // stay at 100 users
    { duration: '10s', target: 0 },    // ramp down to 0 users
  ],
};

export default function () {
  const res = http.get('http://localhost:9002/api/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}</pre>

      <h2>Enforcing SLAs using Thresholds</h2>
      <p>Using k6's <code>thresholds</code> feature, we can configure our CI/CD pipelines to fail the build automatically if p99 latency exceeds 200ms or if the error rate climbs above 1% during tests. This acts as an automated quality gate.</p>
    `
  },
  {
    slug: "building-rag-pipeline-internal-documentation",
    title: "Building an Advanced RAG Pipeline for Developer Knowledge Discovery",
    excerpt: "How we leveraged LangChain and vector databases to build a context-aware search engine for internal APIs.",
    date: "March 10, 2026",
    readTime: "7 min read",
    category: "Artificial Intelligence",
    tags: ["RAG", "LangChain", "Vector DB", "LLMs"],
    content: `
      <p class="lead">Finding documentation across multiple Slack channels, Confluence pages, and markdown repositories is a major developer friction point. We built an internal Retrieval-Augmented Generation (RAG) system to solve this.</p>
      
      <h2>1. The Architecture</h2>
      <p>Our RAG pipeline is built using LangChain and a localized vector database. The process follows a classic ingestion and retrieval architecture:</p>
      <ul>
        <li><strong>Ingestion:</strong> Scripts crawl markdown documents, split text into chunks using recursive character text splitters, and generate semantic embeddings using HuggingFace models.</li>
        <li><strong>Storage:</strong> Embeddings are stored in a vector database for rapid semantic retrieval.</li>
        <li><strong>Generation:</strong> When a developer asks a question, the vector database returns the top 3 most relevant documents, which are passed to the LLM as context to formulate a response.</li>
      </ul>

      <h2>2. Optimizing Chunking and Context Windows</h2>
      <p>One of the largest hurdles was preventing LLM hallucinations. We solved this by implementing parent-document retrieval. We store small chunks (100 tokens) for search, but return the parent document (500 tokens) to the LLM to preserve surrounding context. This improved accuracy by 35%.</p>

      <h2>3. Results</h2>
      <p>The developer assistant now answers natural language questions like 'How do I initialize the auth client?' within 3 seconds, citing exact source links. This has dramatically improved onboarding speed for new developers.</p>
    `
  }
];
