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
    slug: "dotnet-runtime-configurable-background-workers",
    title: "Start, Stop and Retune .NET Background Workers at Runtime, and 3 Bugs My First Version Hid",
    excerpt: "A small .NET 8 manager for named background workers you can start, reconfigure and stop at runtime. A test harness exposed a stop that throws, updates that wait a full interval, and a race that leaves orphaned workers. Here are the fixes, measured.",
    date: "September 23, 2026",
    readTime: "7 min read",
    category: "Software Architecture",
    tags: [".NET Core", "C#", "Background Services", "Concurrency", "Performance"],
    content: `
      <p class="lead">Most .NET background work is fixed at startup: you register a <code>BackgroundService</code> and it runs until the app stops. I wanted something more dynamic: start a named worker, change how often it runs, and stop it, all at runtime. The first version fit in three small files and appeared to work. Then I tested it properly and found three bugs, each of which would hurt in production.</p>

      <h2>1. The Idea</h2>
      <p>A small .NET 8 console app, the <strong>Dynamic Background Service Manager</strong>, accepts commands at a prompt:</p>
      <ul>
        <li><code>START &lt;id&gt; &lt;interval-ms&gt; &lt;config&gt;</code> spins up a new worker loop with its own interval and settings.</li>
        <li><code>UPDATE &lt;id&gt; &lt;interval-ms&gt; &lt;config&gt;</code> changes a running worker without restarting it.</li>
        <li><code>STOP &lt;id&gt;</code> and <code>LIST</code> do what they say.</li>
      </ul>
      <p>This pattern suits per-tenant pollers, sync jobs that operations staff switch on and off, or anything where the number and pace of workers is data, not code.</p>

      <h2>2. The First Version</h2>
      <p>Each worker is an async loop around <code>Task.Delay</code>, cancelled through a <code>CancellationTokenSource</code>. A manager keeps the workers in a <code>ConcurrentDictionary</code>.</p>
      <pre class="language-csharp">
public async Task StartAsync()
{
    Console.WriteLine($"Service {_serviceId} started. ...");

    while (!_cts.Token.IsCancellationRequested)
    {
        Console.WriteLine($"Service {_serviceId} is running with config: {_config.CustomValue}");
        await Task.Delay(_config.Interval, _cts.Token);
    }

    Console.WriteLine($"Service {_serviceId} stopped.");
}

public void Stop() =&gt; _cts.Cancel();
public void UpdateConfig(ConfigData newConfig) =&gt; _config = newConfig;</pre>
      <pre class="language-csharp">
public string StartService(string serviceId, ConfigData config)
{
    if (_services.ContainsKey(serviceId))
        return $"Service {serviceId} is already running.";

    var service = new MyBackgroundService(serviceId, config);
    _services.TryAdd(serviceId, (service, config));

    Task.Run(() =&gt; service.StartAsync());   // fire and forget
    return $"Service {serviceId} started.";
}</pre>
      <p>A quick manual session looked perfect:</p>
      <pre>
Enter command: START a 1000 hello
Service a is running with config: hello
Service a is running with config: hello
Enter command: UPDATE a 200 fast
Service a updated: Interval=200 ms, Config=fast
Service a is running with config: fast
Service a is running with config: fast
Enter command: STOP a
Service a stopped.
Enter command: LIST
No active services.</pre>

      <h2>3. Testing It Properly</h2>
      <p>A manual session proves the happy path. So I wrote a small harness that measures what really happens when a worker stops, when its interval changes, and when several <code>START</code> commands arrive at once:</p>
      <pre>
[1] Stop:    task ended with TaskCanceledException; status = Canceled
[2] Update:  10 s -&gt; 100 ms at 201 ms; first tick on the new config at 10,007 ms
[3] Race:    8 concurrent STARTs, same id: 2 "started" replies in 4 of 200 rounds</pre>

      <h3>Bug 1: stopping is treated as a failure</h3>
      <p><code>Task.Delay(interval, token)</code> doesn't return when the token is cancelled. It <strong>throws</strong> <code>TaskCanceledException</code>. So the loop never reaches its last line: the worker's own "stopped" message never prints, and any cleanup after the loop (flushing a buffer, releasing a lock) would silently never run. The manual session hid this, because the manager prints the same "Service a stopped." text. And since the task was started with fire-and-forget <code>Task.Run</code>, nothing ever observes the exception.</p>

      <h3>Bug 2: UPDATE waits for the old interval</h3>
      <p><code>UpdateConfig</code> swaps the config, but the loop is already asleep inside <code>Task.Delay</code> with the <em>old</em> interval. Changing a 10-second worker to 100 ms took effect only after <strong>10,007 ms</strong>. With an hourly job, "update" would mean "sometime in the next hour".</p>

      <h3>Bug 3: two STARTs can both win</h3>
      <p><code>ContainsKey</code> followed by <code>TryAdd</code> is a check-then-act race. Two concurrent starts can both pass the check. One insert fails, but its return value is ignored, so <strong>both</strong> workers start. The loser isn't in the dictionary, so <code>STOP</code> can never reach it: an orphaned loop that runs until the process dies. It happened in 4 of 200 rounds of 8 parallel starts.</p>

      <h2>4. The Fixed Version</h2>
      <p>Three changes, each aimed at one bug:</p>
      <ul>
        <li><strong>Stopping is not an error.</strong> Catch <code>OperationCanceledException</code> and put cleanup in <code>finally</code>, so it always runs. The worker exposes its <code>Completion</code> task, so a stop can <em>wait</em> for the worker to finish.</li>
        <li><strong>A wake token for updates.</strong> Each delay is linked to two tokens: <em>stop</em> and <em>wake</em>. <code>Update</code> swaps the config (an immutable record, so a reader never sees half an update) and cancels the wake token. The current sleep ends immediately and the next one uses the new interval.</li>
        <li><strong>Let the dictionary decide.</strong> Build the worker, try to insert it, and start it only if the insert won. There's no separate check left to race.</li>
      </ul>
      <pre class="language-csharp">
public sealed record WorkerConfig(TimeSpan Interval, string Value);

public sealed class Worker : IAsyncDisposable
{
    private readonly CancellationTokenSource _stop = new();
    private CancellationTokenSource _wake = new();
    private volatile WorkerConfig _config;

    public Worker(string id, WorkerConfig config) =&gt; (Id, _config) = (id, config);

    public string Id { get; }
    public WorkerConfig Config =&gt; _config;
    public Task Completion { get; private set; } = Task.CompletedTask;

    public void Start() =&gt; Completion = RunAsync();

    private async Task RunAsync()
    {
        await Task.Yield(); // return to the caller right away
        try
        {
            while (!_stop.IsCancellationRequested)
            {
                var config = _config;
                Console.WriteLine($"[{Id}] tick: {config.Value}");

                using var delay = CancellationTokenSource.CreateLinkedTokenSource(_stop.Token, _wake.Token);
                try { await Task.Delay(config.Interval, delay.Token); }
                catch (OperationCanceledException) when (!_stop.IsCancellationRequested) { } // woken by Update
            }
        }
        catch (OperationCanceledException) { } // stopping is not an error
        finally
        {
            Console.WriteLine($"[{Id}] stopped"); // cleanup always runs
        }
    }

    public void Update(WorkerConfig config)
    {
        _config = config;
        // Cut the current delay short so the new interval applies now.
        Interlocked.Exchange(ref _wake, new CancellationTokenSource()).Cancel();
    }

    public async ValueTask DisposeAsync()
    {
        _stop.Cancel();
        await Completion;
        _stop.Dispose();
    }
}</pre>
      <pre class="language-csharp">
public sealed class WorkerManager : IAsyncDisposable
{
    private readonly ConcurrentDictionary&lt;string, Worker&gt; _workers = new();

    public bool Start(string id, WorkerConfig config)
    {
        var worker = new Worker(id, config);
        if (!_workers.TryAdd(id, worker)) return false; // only the winner ever runs
        worker.Start();
        return true;
    }

    public async Task&lt;bool&gt; StopAsync(string id)
    {
        if (!_workers.TryRemove(id, out var worker)) return false;
        await worker.DisposeAsync(); // returns once the worker has really finished
        return true;
    }

    public bool Update(string id, WorkerConfig config)
    {
        if (!_workers.TryGetValue(id, out var worker)) return false;
        worker.Update(config);
        return true;
    }

    public IReadOnlyDictionary&lt;string, WorkerConfig&gt; List() =&gt;
        _workers.ToDictionary(p =&gt; p.Key, p =&gt; p.Value.Config);

    public async ValueTask DisposeAsync() =&gt;
        await Task.WhenAll(_workers.Keys.Select(StopAsync));
}</pre>

      <h2>5. Results</h2>
      <p>The same harness against the new code:</p>
      <pre>
[1] Stop:    StopAsync = true; the worker's finally block ran
[2] Update:  10 s -&gt; 100 ms at 201 ms; first tick on the new config at 207 ms
[3] Race:    rounds without exactly one successful START: 0 of 2,000</pre>
      <p>A stop now waits for cleanup, an update applies within milliseconds instead of after a full interval, and 2,000 rounds of concurrent starts produced exactly one worker each time.</p>

      <h2>6. Hosting It in ASP.NET Core</h2>
      <p>The manager doesn't care where commands come from. Registered as a singleton, it becomes a small HTTP API. A hosted service stops every worker cleanly when the app shuts down, which covers the last gap the console version had: its <code>EXIT</code> left running loops behind.</p>
      <pre class="language-csharp">
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton&lt;WorkerManager&gt;();
builder.Services.AddHostedService&lt;WorkerShutdown&gt;();
var app = builder.Build();

app.MapPost("/workers/{id}", (string id, WorkerConfig config, WorkerManager m) =&gt;
    m.Start(id, config) ? Results.Created($"/workers/{id}", config) : Results.Conflict());
app.MapPut("/workers/{id}", (string id, WorkerConfig config, WorkerManager m) =&gt;
    m.Update(id, config) ? Results.NoContent() : Results.NotFound());
app.MapDelete("/workers/{id}", async (string id, WorkerManager m) =&gt;
    await m.StopAsync(id) ? Results.NoContent() : Results.NotFound());
app.MapGet("/workers", (WorkerManager m) =&gt; m.List());

app.Run();

// Stops every worker cleanly when the app shuts down.
sealed class WorkerShutdown(WorkerManager manager) : IHostedService
{
    public Task StartAsync(CancellationToken ct) =&gt; Task.CompletedTask;
    public async Task StopAsync(CancellationToken ct) =&gt; await manager.DisposeAsync();
}</pre>
      <pre>
POST   /workers/a   {"interval":"00:00:01","value":"hello"}   -&gt; 201 Created
POST   /workers/a   (same id again)                             -&gt; 409 Conflict
PUT    /workers/a   {"interval":"00:00:00.3","value":"fast"}    -&gt; 204, applied immediately
GET    /workers     {"a":{"interval":"00:00:00.3000000","value":"fast"}}
DELETE /workers/a                                               -&gt; 204, after "[a] stopped"
DELETE /workers/a   (again)                                     -&gt; 404</pre>

      <h2>7. Takeaways</h2>
      <ul>
        <li><strong>Cancellation throws.</strong> Any <code>await</code> that takes a token can end in <code>OperationCanceledException</code>. Treat it as a normal exit and put cleanup in <code>finally</code>.</li>
        <li><strong>"Update" means waking the loop</strong>, not just swapping a field that the loop reads after its next sleep.</li>
        <li><strong>On concurrent collections, the atomic operation is the check.</strong> <code>ContainsKey</code> then <code>TryAdd</code> is two operations. Use the result of <code>TryAdd</code>, <code>GetOrAdd</code> or <code>TryRemove</code>.</li>
        <li><strong>Don't fire and forget.</strong> Keep the task, so stopping can await it and failures have somewhere to go.</li>
        <li><strong>Test the edges, not the demo.</strong> A 60-line harness found all three bugs; the manual session found none.</li>
      </ul>
    `
  },
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
      <pre>
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
      <pre class="language-hcl">
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
    slug: "homelab-vmss-docker-swarm-vs-k3s",
    title: "Building a VMSS-Style Cluster from 10 Mini PCs: Why I'm Starting with Docker Swarm, Not K3s",
    excerpt: "Ten 13th-gen machines with 8 GB RAM each, a zero-dollar software budget, and no Kubernetes experience. Here's the research, the trade-offs, and the build order I settled on.",
    date: "August 24, 2026",
    readTime: "7 min read",
    category: "DevOps",
    tags: ["Docker Swarm", "K3s", "Proxmox", "Homelab", "Kubernetes"],
    content: `
      <p class="lead">Azure VM Scale Sets are great: a pool of machines that restarts failed instances, balances load and rolls out updates for you. I had ten physical machines sitting on a desk and wanted the same behaviour, with nothing but free tools. This post is the research and the decision.</p>

      <h2>1. The Hardware and the Constraint</h2>
      <ul>
        <li><strong>10 machines</strong>, each a 13th-gen Intel CPU. About 130 cores in total.</li>
        <li><strong>8 GB RAM per node</strong>. About 80 GB across the cluster, which turns out to be the constraint that drives every decision.</li>
        <li><strong>$0 software budget</strong> and <strong>zero Kubernetes experience</strong>.</li>
      </ul>
      <p>The goal was VMSS-like behaviour: auto-restart on failure, load balancing, rolling updates and work spread across all ten nodes.</p>

      <h2>2. The Foundation Is the Same Either Way</h2>
      <p><strong>Proxmox VE</strong> goes on every node first. It clusters the machines, gives you a web UI for all ten, and lets you carve up VMs if you need them. Two things matter more than anything else here:</p>
      <ul>
        <li><strong>Static IPs</strong> for every node (as DHCP reservations). Dynamic addresses make nodes lose each other after a reboot.</li>
        <li><strong>A managed switch</strong>. An unmanaged one works for Swarm but blocks the VLAN features you'll want later.</li>
      </ul>
      <p>At 8 GB per node, Ceph is out; it wants far more memory than that. One node serving <strong>NFS</strong> for shared storage is the practical replacement.</p>

      <h2>3. The Two Contenders</h2>
      <pre>
                    Docker Swarm             K3s (lightweight Kubernetes)
Setup time          ~30 minutes              ~2-3 hours (with troubleshooting)
RAM per node        ~1.5 GB with services    ~3.5 GB with services
Autoscaling         manual or scripted       automatic (HPA)
Learning curve      you already know Docker  YAML, networking, controllers
Dashboard           Portainer CE             Rancher / Lens / k9s</pre>
      <p>Both give you what VMSS gives you: rescheduling when a node dies, a routing mesh or service load balancer, and zero-downtime rolling updates. The differences are overhead, autoscaling and how much there is to learn.</p>

      <h2>4. The Verdict: Swarm First, K3s Later</h2>
      <p>Starting with full Kubernetes with no experience means spending most of your time debugging YAML and cluster networking rather than running workloads. With zero services deployed, Kubernetes adds no value yet. Docker Swarm:</p>
      <ul>
        <li>Is built into Docker, so the only new commands are <code>docker swarm init</code> and <code>docker service create</code>.</li>
        <li>Leaves more RAM for the apps, which matters most at 8 GB per node.</li>
        <li>Uses the same container images K3s would, so migrating later is a change of commands, not a rewrite.</li>
      </ul>
      <p><strong>When to move to K3s:</strong> at 20+ services, when you need CPU/memory-based autoscaling (Swarm can't do this natively), or when you need fine-grained scheduling, secrets or network policies.</p>

      <h2>5. The Build Order</h2>
      <pre>
# Phase 1 - foundation
static IPs + Wake-on-LAN -> Proxmox VE on all 10 nodes

# Phase 2 - cluster + storage
pvecm create my-cluster        # node 1
pvecm add &lt;node-1-ip&gt;         # nodes 2-10
NFS export on node 10, mounted on nodes 1-9

# Phase 3 - Swarm
docker swarm init              # node 1
3 managers (odd number for quorum), 7 workers
docker service create --name test --replicas 5 nginx
Portainer for the dashboard

# Phase 4 - prove it
unplug a worker -> service recovers
10 replicas -> one per node
rolling image update -> zero downtime</pre>

      <h2>6. Takeaways</h2>
      <ul>
        <li>Pick the orchestrator by what you'll <em>run</em>, not by what's on job listings. The simpler tool you understand beats the powerful one you're fighting.</li>
        <li>Memory per node, not total cores, decides the storage and orchestration stack.</li>
        <li>Keep a migration path open. Containers are the portable layer; the orchestrator is swappable.</li>
      </ul>
    `,
  },
  {
    slug: "nextjs-dotnet-on-demand-isr",
    title: "Static Pages, Fresh Content: On-Demand ISR Between Next.js 16 and a .NET API",
    excerpt: "Zero API calls per page view, and content that updates the moment an editor saves. A hands-on proof of concept with tag-based revalidation driven by .NET webhooks, plus two traps I hit along the way.",
    date: "August 22, 2026",
    readTime: "8 min read",
    category: "Software Architecture",
    tags: ["Next.js", ".NET Core", "ISR", "Caching", "Webhooks"],
    content: `
      <p class="lead">A server-rendered Next.js site backed by a .NET API usually calls that API on every page view, even when the content hasn't changed in days. I wanted static-file speed with CMS-level freshness and no rebuilds. This POC proves it with tag-based on-demand ISR (Incremental Static Regeneration), triggered by webhooks from .NET.</p>

      <h2>1. The Architecture</h2>
      <pre>
.NET Core API ──▶ Next.js (build) ──▶ static HTML cache ──▶ users (no API call)
      │                                      ▲
      └──── POST /api/revalidate ────────────┘
          (fired by .NET the instant content changes)</pre>
      <ul>
        <li>Every content page (<code>/[slug]</code>) tags its fetch with <code>page-{slug}</code>. The home listing uses <code>all-pages</code>.</li>
        <li>After every create, update or delete, .NET sends a signed webhook naming exactly which tags to invalidate.</li>
        <li>The revalidate route checks a shared secret (401 otherwise) and expires only those tags.</li>
      </ul>

      <h2>2. What Actually Happens, Request by Request</h2>
      <p><strong>Steady state.</strong> <code>/home</code> is prerendered at build time. I hit it five times against a production server and the .NET log didn't grow by a single line. Zero backend calls.</p>
      <p><strong>An editor saves.</strong> .NET updates the record, then fires a webhook: <code>{ slug: "home", listingChanged: false }</code>. Next.js marks <code>page-home</code> expired. Nothing is fetched yet.</p>
      <p><strong>The next visitor.</strong> That one request does a single live fetch, renders fresh HTML and re-caches it. Every visitor after that gets the cached page again. That's <strong>one backend call per content change</strong>, not one per visitor.</p>

      <h2>3. New Pages and Deleted Pages</h2>
      <p><code>generateStaticParams()</code> only knows slugs that existed at build time. Two small pieces cover the rest:</p>
      <ul>
        <li><code>export const dynamicParams = true</code> lets an unknown slug render on demand (then cache) instead of returning a 404.</li>
        <li>The backend checks whether the slug existed before writing. For creates and deletes it sets <code>listingChanged: true</code>, which also expires <code>all-pages</code>, so the new page appears in the navigation.</li>
      </ul>
      <p>Deletes surfaced a real bug: a missing page threw a raw error, and Next.js turned that into a <strong>500</strong>. The fix is to treat an API 404 as "not found", return <code>null</code> and call <code>notFound()</code>. An API that's actually broken should still throw and surface as a 500.</p>

      <h2>4. Trap #1: Dev Mode Lies About Caching</h2>
      <p><code>next dev</code> doesn't honour the fetch cache the way production does. I disabled the webhook entirely, edited content in .NET, and the dev server still showed the change instantly. That makes it look as if revalidation isn't needed. Only <code>next build &amp;&amp; next start</code> shows real caching. <strong>Always validate this pattern against a production build.</strong></p>

      <h2>5. Trap #2: Next.js 16 Changed <code>revalidateTag</code></h2>
      <p>The single-argument <code>revalidateTag(tag)</code> from most tutorials is deprecated in Next.js 16. It now takes a second argument:</p>
      <pre class="language-typescript">
// expire immediately: what a synchronous "content saved" webhook wants
revalidateTag('page-home', { expire: 0 });

// stale-while-revalidate semantics
revalidateTag('page-home', 'max');</pre>
      <p><code>create-next-app@latest</code> installed a version far newer than the tutorials assume. When an API behaves oddly, check the docs bundled in <code>node_modules/next/dist/docs/</code> before trusting remembered examples.</p>

      <h2>6. Takeaways</h2>
      <ul>
        <li>Tag-based ISR gives static-site cost with CMS freshness, and the backend decides exactly what goes stale.</li>
        <li>Fire the webhook from the write path, and sign it.</li>
        <li>Handle "created" and "deleted" explicitly. They're the cases that break listings and error pages.</li>
        <li>Test caching behaviour only against production builds.</li>
      </ul>
    `,
  },
  {
    slug: "hybrid-search-solr-bm25-vector-rrf",
    title: "Hybrid Product Search on Solr 9: BM25 + Vectors + Reciprocal Rank Fusion in .NET",
    excerpt: "Keyword search misses meaning; vector search misses exact terms. Fusing both with RRF, adding rule-based query understanding and running embeddings in-process gave a search that handles \"red card case and gold tone watch under 5000\".",
    date: "August 14, 2026",
    readTime: "10 min read",
    category: "Software Architecture",
    tags: ["Solr", "Vector Search", "RRF", "ONNX", ".NET Core"],
    content: `
      <p class="lead">E-commerce search fails in two opposite ways. BM25 keyword search can't tell that "evening wristwatch" and "dress watch" mean the same thing. Pure vector search happily returns "something watch-like" when the shopper typed an exact SKU. This R&amp;D engine runs both and fuses the results, on a Solr 9 core of about 540 real catalog products, without touching the production search path.</p>

      <h2>1. The Pipeline</h2>
      <pre>
query ─▶ SKU short-circuit ─▶ split into item clauses ─▶ for each clause:
   ├─ price phrase parser        (under / between / ~ / 12k)
   ├─ rule-based NLU             (brand, category, colour, size, badge, type)
   ├─ fuzzy fallback             (Solr ~2 edit distance on *_text fields)
   ├─ in-process ONNX embedding  (all-MiniLM-L6-v2, 384 dims)
   ├─ BM25 keyword search        (edismax)
   ├─ kNN vector search          ({!knn f=vector topK=N})
   └─ RRF fusion
─▶ merge clauses ─▶ de-dup by style ─▶ page ─▶ UI view model</pre>

      <h2>2. Reciprocal Rank Fusion</h2>
      <p>BM25 scores and cosine similarities live on different scales, so you can't just add them. RRF ignores scores and uses only rank positions:</p>
      <pre>
score(doc) = Σ over result lists  1 / (K + rank(doc))      K = 60</pre>
      <p>A product ranked well by <em>both</em> retrievers rises to the top. One found by only one retriever still gets a fair share. The same primitive powers the "similar products" endpoint, where it fuses vector similarity with Solr's MoreLikeThis.</p>

      <h2>3. Embeddings Without an API Call</h2>
      <ul>
        <li><strong>all-MiniLM-L6-v2</strong> in ONNX format, run in-process with <code>Microsoft.ML.OnnxRuntime</code>, tokenised with <code>FastBertTokenizer</code>.</li>
        <li>Mean-pooled and L2-normalised into a 384-dimensional vector. The query is embedded live; product vectors are precomputed and stored in Solr.</li>
        <li>No network hop and no per-query cost for an external embedding API.</li>
      </ul>

      <h2>4. Query Understanding Without an LLM</h2>
      <p>The NLU is deterministic and explainable: lexicon lookup and regex against a <strong>live vocabulary</strong>. A <code>BackgroundService</code> refreshes the real distinct values in the index (brands, colours, categories and so on) every five minutes using Solr facet queries. When the catalog changes, the parser updates without a redeploy.</p>
      <ul>
        <li><strong>Typos:</strong> "Fossle" resolves via Solr's native fuzzy operator. A curated stop-word list (~60 words) stops common English words from being offered as fuzzy matches.</li>
        <li><strong>Synonyms live in Solr</strong>, not in C# dictionaries. Gender and size moved to <code>*_text</code> fields backed by <code>synonyms.txt</code>.</li>
        <li><strong>Prices:</strong> "under X", "between X and Y", reversed phrasing, "~X" (±10%), "12,000" and "12k".</li>
      </ul>

      <h2>5. Multi-Intent Queries</h2>
      <p>"red card case and gold tone watch under 5000" is two searches. Splitting on commas and a standalone "and" (while protecting "between X and Y" and "12,000") lets each clause run the <em>entire</em> pipeline with its own price and filters. Otherwise the watch clause's category filter would starve the card-case clause.</p>
      <p>The reverse case matters too. In "black and blue watches", "black" is only a modifier. Clauses that contain nothing but a colour, brand or gender word get merged into their neighbour, so they don't trigger a catalog-wide search for "black".</p>

      <h2>6. The Details That Make It Feel Right</h2>
      <ul>
        <li><strong>Style-level de-dup:</strong> the same style in three colours shows once, with its colour swatches harvested through Solr collapse + expand.</li>
        <li><strong>Phrase proximity</strong> (<code>pf2</code>) reranks adjacent-word matches above bag-of-words hits.</li>
        <li><strong>Business signals</strong> (rating, sale count, availability) as an edismax boost function that nudges relevance but doesn't override it.</li>
        <li><strong>Embedded SKUs</strong> ("watch FS6121") are forced to position one.</li>
        <li><strong>Autosuggest</strong> through Solr's Suggester component for fast prefix and infix matches.</li>
      </ul>

      <h2>7. Takeaways</h2>
      <ul>
        <li>Hybrid beats either retriever alone, and RRF is the simplest fusion that works without score calibration.</li>
        <li>You don't need an LLM for query understanding in a bounded domain. A live vocabulary and good rules are faster, cheaper and explainable.</li>
        <li>Push linguistics (synonyms, fuzziness, suggesters) into the search engine, and keep the application code for orchestration.</li>
      </ul>
    `,
  },
  {
    slug: "rag-chatbot-latency-audit",
    title: "Why Our RAG Chatbot Took 40 Seconds to Answer, and the Plan to Make It 70% Faster",
    excerpt: "An end-to-end audit of a multi-tenant .NET RAG chatbot found 7-8 LLM calls per request, a duplicate vector search and 1.5 seconds of artificial streaming delay. Here's where the time went and the fix plan.",
    date: "July 17, 2026",
    readTime: "8 min read",
    category: "Artificial Intelligence",
    tags: ["RAG", "LLMs", "Semantic Kernel", "Performance", ".NET Core"],
    content: `
      <p class="lead">We're building a multi-tenant RAG chatbot platform on .NET 10: an embeddable widget, SignalR streaming, pgvector retrieval, a text-to-SQL agent, MCP tools and episodic memory. It worked, but a data question took 30-40 seconds. I audited the whole request path to find out why.</p>

      <h2>1. The Platform in One Picture</h2>
      <pre>
Next.js admin portal  |  embeddable JS widget (iframe)
              │  REST + SignalR
              ▼
   ASP.NET Core gateway (.NET 10) ─ Semantic Kernel agents
     │           │           │          │          │
 pgvector    RabbitMQ      Redis     MongoDB    mem0 (Qdrant)
 (RAG)     (ingestion)  (cache +    (chat +    (long-term
                        backplane)   audit)     memory)</pre>
      <p>Heavy work (document ingestion and audit logging) goes through RabbitMQ consumers, so the gateway stays non-blocking. Vectors are namespaced per tenant.</p>

      <h2>2. Where 40 Seconds Went</h2>
      <p>For a SQL-style question, roughly 12-15 seconds is unavoidable LLM and database work. The other ~13 seconds was waste:</p>
      <pre>
nested SQL LLM calls           ~8000 ms   ◀ biggest win
redundant intent re-parsing    ~2000 ms
artificial streaming delay     ~1500 ms
duplicate vector search         ~300 ms
redundant kernel clones         ~300 ms
other overhead                  ~500 ms</pre>

      <h2>3. Finding #1: The LLM Call Cascade</h2>
      <p>The SQL path made its calls in sequence: classify intent, re-derive intent, discover tables, analyse the schema, generate SQL, validate SQL. That's <strong>7-8 LLM calls per request</strong> where 2-3 would do. The step that re-derived intent was redundant, because the classifier had already decided the question was a SQL question.</p>
      <p><strong>Plan:</strong> a single generation prompt with the relevant schema inlined, which analyses, generates and validates in one pass. It's the simplest architecture, the easiest to debug, and worth an estimated 8-12 seconds. The risk is SQL accuracy, so it ships behind a feature flag and gets A/B tested on 20+ reference questions.</p>

      <h2>4. Finding #2: Streaming That Wasn't</h2>
      <p>Responses were re-chunked into 20-character pieces with a 15 ms pause between each. A 2,000-character answer means 100 chunks, or <strong>1.5 seconds of pure delay</strong>, added to a model that already streams natively. The fix is to forward tokens as they arrive.</p>

      <h2>5. Finding #3: Doing the Same Work Twice</h2>
      <ul>
        <li><strong>Duplicate vector search:</strong> two services ran the same schema-context search on every request. Search once, pass the result down.</li>
        <li><strong>Kernel cloning:</strong> the Semantic Kernel instance was cloned 3-4 times per request, each clone creating a new client connection (50-100 ms each). Reuse the base kernel and attach plugins per step.</li>
        <li><strong>MCP connections:</strong> a new connection per request (300-800 ms). Cache them in a <code>ConcurrentDictionary</code> keyed by server and URL, and dispose them deterministically when config changes.</li>
      </ul>

      <h2>6. The Reliability Checklist That Came With It</h2>
      <p>Performance audits find correctness problems too. These are the checks I now run on any multi-tenant AI backend:</p>
      <ul>
        <li><strong>Every cache key includes the tenant ID.</strong> Anything else is a cross-tenant data leak waiting to happen.</li>
        <li><strong>No fire-and-forget without retries.</strong> Background ingestion needs retries and visibility, or data goes missing silently.</li>
        <li><strong>Invalidate caches per tenant.</strong> A global flush makes every tenant rebuild at once.</li>
        <li><strong>Put a bound on in-process caches</strong>, and make disposal ownership explicit for pooled clients.</li>
      </ul>

      <h2>7. The Plan</h2>
      <pre>
Week 1    quick wins: streaming, duplicate search, kernel reuse, MCP pooling
          target: 30-40 s ─▶ 20-25 s
Week 2-3  single-shot SQL, cached intent, parallel pipeline steps
          target: ─▶ 8-12 s
Week 3-4  tenant isolation, retries, per-tenant invalidation, latency dashboards</pre>

      <h2>8. Takeaways</h2>
      <ul>
        <li>In LLM apps, <strong>count the calls</strong> before tuning anything else. Sequential calls dominate latency.</li>
        <li>Don't simulate streaming on top of a model that already streams.</li>
        <li>Measure first: this audit turned "the chatbot is slow" into a ranked list of 12 fixes with estimated savings.</li>
      </ul>
    `,
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

      <pre class="language-csharp">
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

      <pre class="language-javascript">
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
