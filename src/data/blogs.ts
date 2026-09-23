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
    slug: "turning-my-macbook-into-a-self-hosted-paas",
    title: "How I Turned My MacBook into a Self-Hosted Vercel with Coolify, Cloudflare Tunnel & Terraform",
    excerpt: "An 8 GB M1 MacBook, a domain, and zero open router ports: building a git-push-to-deploy platform at home, and the six things that broke along the way.",
    date: "September 23, 2026",
    readTime: "9 min read",
    category: "DevOps",
    tags: ["Coolify", "Cloudflare Tunnel", "Terraform", "Self-Hosting", "Docker"],
    content: `
      <p class="lead">I wanted a place to host demo apps and APIs the way Vercel does it: push to GitHub, get a live HTTPS URL. Instead of paying for a platform, I turned a 2020 M1 MacBook Pro (8 GB RAM) into one. The site you are reading right now is served from that laptop. Here is the architecture, the build, and the problems I hit on the way.</p>

      <h2>1. What the Mac Can (and Can't) Do</h2>
      <p>My first idea was to run LLMs on it. With 8 GB of unified memory, that was never going to work: the models I use are 18 to 21 GB. What an M1 is great at is the lightweight part of a platform: a build server, a reverse proxy, a handful of Next.js and .NET containers, and a couple of databases. Heavy AI inference stays on a separate GPU box.</p>

      <h2>2. The Architecture</h2>
      <pre class="bg-black/40 p-4 rounded-xl text-xs overflow-x-auto text-emerald-400 border border-white/5">
git push ──▶ GitHub webhook ──▶ Coolify (Linux VM on the Mac)
                                   │  builds image, rolls out container
                                   ▼
Browser ─▶ app.mydomain ─▶ Cloudflare edge (HTTPS) ─▶ Tunnel ─▶ Traefik ─▶ container

Terraform ──▶ Cloudflare API  (tunnel, DNS, routing rules)
          └─▶ Coolify API     (projects, apps, databases, services)</pre>
      <ul>
        <li><strong>Colima</strong> runs a lightweight Ubuntu VM (4 CPU / 4 GB) because Coolify needs Linux.</li>
        <li><strong>Coolify</strong> is the open-source Heroku/Vercel alternative: GitHub integration, Nixpacks/Dockerfile builds, one-click databases, rolling deploys with health checks.</li>
        <li><strong>Cloudflare Tunnel</strong> makes an outbound-only connection to Cloudflare. No port forwarding, no static IP, free HTTPS, and my home IP is never exposed.</li>
        <li><strong>Terraform</strong> describes the whole thing as code: the tunnel, a wildcard DNS record, and every app.</li>
      </ul>

      <h2>3. Wildcard Routing: One Rule for Every App</h2>
      <p>The trick that makes it feel like a PaaS is a single wildcard DNS record pointing at the tunnel, with the tunnel sending everything to Coolify's Traefik proxy. Traefik routes by hostname, so a new app just needs a domain in Coolify. No DNS or Cloudflare changes, ever.</p>
      <pre class="bg-black/40 p-4 rounded-xl text-xs overflow-x-auto text-emerald-400 border border-white/5">
resource "cloudflare_dns_record" "wildcard" {
  zone_id = var.cloudflare_zone_id
  name    = "*.mydomain.com"
  type    = "CNAME"
  content = "TUNNEL_ID.cfargotunnel.com"
  proxied = true
}

# Tunnel ingress: every subdomain goes to Traefik
{ hostname = "*.mydomain.com", service = "http://coolify-proxy:80" }</pre>
      <p>Apps themselves are Terraform resources too. The community Coolify provider can't create applications, so I drive Coolify's REST API with the generic <code>restapi</code> provider. Adding a site is now one map entry and a <code>terraform apply</code>.</p>

      <h2>4. Six Things That Broke (and the Fixes)</h2>
      <ul>
        <li><strong>Coolify couldn't SSH into its own server.</strong> It connects to <code>host.docker.internal</code>, but under Colima that name points at the Mac, not the Linux VM. Pointing the server at the VM's Docker gateway IP fixed it.</li>
        <li><strong>Every <code>https://</code> domain became a redirect loop or a 404.</strong> The tunnel talks plain HTTP to Traefik while Cloudflare terminates TLS. An <code>https://</code> domain in Coolify makes Traefik redirect HTTP to HTTPS forever. Rule of thumb: always <code>http://app.domain:PORT</code> in Coolify; the visitor still gets HTTPS from Cloudflare.</li>
        <li><strong>The apex domain wouldn't route.</strong> <code>*.domain</code> does not match <code>domain</code> itself. The bare domain needs its own DNS record and tunnel rule.</li>
        <li><strong>An n8n worker crash-looped with NOAUTH.</strong> Enabling "Connect to Predefined Network" attached it to Coolify's internal network, where the hostname <code>redis</code> also belongs to Coolify's own password-protected Redis. Turning that setting off restored isolation and fixed the crash.</li>
        <li><strong>Terraform updates broke deployments.</strong> Coolify's create endpoint stores a GitHub repo as <code>owner/repo</code>, but its PATCH endpoint stores whatever you send and later prefixes <code>github.com</code> again. Sending the short form on update fixed it. I only found this because I redeployed right after a Terraform change.</li>
        <li><strong>"The site is down" (it wasn't).</strong> My router cached the domain's empty answer from the minutes when DNS was mid-migration. The whole internet could see the site except my own Wi-Fi. Negative DNS caching is real.</li>
      </ul>

      <h2>5. Security on a Home Server</h2>
      <ul>
        <li><strong>No inbound ports</strong>: the tunnel only makes outbound connections.</li>
        <li><strong>Webhook-only exposure</strong>: GitHub reaches a hostname that forwards only the <code>/webhooks/</code> path to Coolify; everything else returns 404. Each webhook is signed with a secret.</li>
        <li><strong>The admin dashboard</strong> requires a password plus TOTP 2FA, and its REST API is blocked at the tunnel (API tokens bypass 2FA). Terraform uses the API over localhost only.</li>
        <li><strong>Tools with root-level Docker access</strong> (Portainer) stay bound to localhost, not the internet.</li>
        <li><strong>Secrets</strong> live in the macOS Keychain and are passed to Terraform as environment variables, never in files.</li>
        <li><strong>Nightly backups</strong> of Coolify's database, encryption key and SSH keys go to the Mac's disk, outside the VM, with 14-day retention.</li>
      </ul>

      <h2>6. The Result</h2>
      <p>This blog post is the test. I committed it to the portfolio repo, pushed to <code>main</code>, and GitHub's webhook told Coolify to rebuild. With a health check on <code>/</code>, the old container keeps serving until the new one is healthy, so the deploy has no downtime. Grafana and n8n run alongside it as one-click services on their own subdomains.</p>

      <h2>7. Honest Limitations</h2>
      <ul>
        <li>It's a laptop: if it sleeps or loses power, the sites go down. Fine for demos, not for production.</li>
        <li>8 GB is tight. Builds are the peak, so I keep concurrent builds to one.</li>
        <li>The same Terraform code can later point at a small cloud VM with almost no changes. That is the real win of doing it as code from day one.</li>
      </ul>
    `
  },
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
