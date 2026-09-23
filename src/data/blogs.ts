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
    slug: "mcp-server-code-database-intelligence",
    title: "Giving AI Assistants a Map of Your Codebase: An MCP Server for C# Code and SQL Server Schemas",
    excerpt: "How I built a Model Context Protocol server that analyses C# solutions with Roslyn and SQL Server schemas through catalogue views, stores a structured map in MongoDB per workspace, and exposes it to AI assistants as 40+ tools.",
    date: "September 23, 2026",
    readTime: "14 min read",
    category: "Artificial Intelligence",
    tags: ["MCP", "Roslyn", ".NET Core", "MongoDB", "SQL Server"],
    content: `
      <p class="lead">AI coding assistants are great with the file you have open and poor at answering questions about a 40-project solution they have never seen: "Who calls this stored procedure?", "Which tables does cancelling an order touch?", "What does this DTO look like?". This post walks through an MCP server I built to fix that. It reads C# solutions with Roslyn and SQL Server schemas through system views, stores a structured map of both in MongoDB, and exposes that map to any AI assistant as more than 40 Model Context Protocol tools.</p>

      <h2>1. The Problem: Context, Not Intelligence</h2>
      <p>A language model can reason about code perfectly well. What it lacks in a large legacy system is the <em>map</em>: which class lives in which project, which methods call which stored procedures, which tables those procedures read and write. Pasting files into a chat doesn't scale, and plain text search misses what a name <em>means</em>. <code>Order</code> the class, <code>Order</code> the table and <code>order</code> the variable all look the same to grep.</p>
      <p>The approach: <strong>precompute the map once, keep it fresh on a schedule, and let the assistant query it</strong> instead of guessing. The Model Context Protocol (MCP) is the standard way to plug that kind of query surface into Claude, Copilot, Cursor or any other MCP client.</p>

      <h2>2. Architecture at a Glance</h2>
      <pre>
Source repositories ──┐
                       ├──▶ Sync worker ──▶ Roslyn analyzer ────────┐
 SQL Server database ──┘   (per workspace)  Schema extractor ───────┤
                                                                    ▼
                                                   MongoDB (one database per workspace)
                                                                    │
 AI assistant ◀──── MCP endpoint /{workspace}/mcp ◀─── tool executor ┘</pre>
      <ul>
        <li><strong>Sync worker</strong>: a background service that, per workspace and on a schedule, downloads the source, analyses it and extracts the database schema.</li>
        <li><strong>Roslyn analyzer</strong>: turns every class and method into structured metadata: signatures, dependencies, stored procedures used, complexity and documentation.</li>
        <li><strong>Schema extractor</strong>: reads tables, columns, keys, indexes and stored procedures from SQL Server's catalogue views.</li>
        <li><strong>MongoDB</strong>: one database per workspace, holding classes, methods, method source, tables and stored procedures.</li>
        <li><strong>MCP endpoint</strong>: JSON-RPC over HTTP at <code>/{workspace}/mcp</code>, backed by a single tool executor.</li>
        <li><strong>Blazor dashboard</strong>: workspaces, sync status and live logs for whoever operates it.</li>
      </ul>

      <h2>3. Step 1: Fetching Source Without a Working Copy</h2>
      <p>The server never keeps a clone. Each sync asks the Git host's REST API for the repository's full item list (optionally on a specific branch), then downloads every file into a directory created for that run only:</p>
      <pre class="language-csharp">
// 1. List every item in the repository (optionally on a given branch)
var itemsUrl = $"{baseUrl}/repositories/{repoId}/items"
             + $"?scopePath=/&amp;recursionLevel=Full{branchFilter}";

// 2. Download each file into a throwaway directory for this sync run
foreach (var item in items.Where(i =&gt; !i.IsFolder))
{
    var localPath = Path.Combine(repoDir, item.Path.TrimStart('/'));
    Directory.CreateDirectory(Path.GetDirectoryName(localPath)!);
    var bytes = await http.GetByteArrayAsync(FileUrl(repoId, item.Path));
    await File.WriteAllBytesAsync(localPath, bytes);
}</pre>
      <pre class="language-csharp">
var workDir = Path.Combine(Path.GetTempPath(), $"code-sync_{Guid.NewGuid():N}");
Directory.CreateDirectory(workDir);
try
{
    // download → analyze → extract schema → save
}
finally
{
    Directory.Delete(workDir, recursive: true);   // nothing left on disk, even on failure
}</pre>
      <p>Three small decisions keep this robust. The temp directory has a GUID in its name, so overlapping runs can never collide. Cleanup sits in <code>finally</code>, so a failed run leaves nothing behind. And a missing branch returns "skip this repository" instead of an exception, so one misconfigured repo doesn't cancel the whole sync.</p>

      <h2>4. Step 2: Understanding the Code with Roslyn</h2>
      <p>Regexes can find the word <code>class</code>. Roslyn, the C# compiler as a library, knows what every identifier <em>binds to</em>. The analyzer loads each solution through <code>MSBuildWorkspace</code>, compiles each project, and walks every document:</p>
      <pre class="language-csharp">
// Once per process: point Roslyn at an installed MSBuild
if (!MSBuildLocator.IsRegistered)
    MSBuildLocator.RegisterDefaults();

var workspace = MSBuildWorkspace.Create();
workspace.WorkspaceFailed += (_, e) =&gt; logger.LogWarning(e.Diagnostic.Message);

foreach (var slnPath in Directory.GetFiles(sourceDir, "*.sln", SearchOption.AllDirectories))
{
    var solution = await workspace.OpenSolutionAsync(slnPath);
    foreach (var project in solution.Projects)
    {
        if (await project.GetCompilationAsync() is null) continue;

        foreach (var document in project.Documents.Where(d =&gt; d.FilePath!.EndsWith(".cs")))
        {
            var root  = await document.GetSyntaxRootAsync();      // what the code says
            var model = await document.GetSemanticModelAsync();   // what it means
            foreach (var cls in root!.DescendantNodes().OfType&lt;ClassDeclarationSyntax&gt;())
                results.Add(Describe(cls, model!, project, slnPath));
        }
    }
}</pre>
      <p>The key distinction is <strong>syntax tree vs semantic model</strong>. The syntax tree is the shape of the text: this is a class declaration, that is a method call. The semantic model is what the compiler concluded: this identifier is the type <code>OrderRepository</code> from the <code>Shop.Data</code> assembly. Almost everything useful below comes from the semantic model.</p>

      <h3>What gets extracted per class</h3>
      <p>Each class becomes one document with its methods nested inside. The ID combines namespace, class, project and file, so the same class name in two projects stays distinct:</p>
      <pre class="language-json">
{
  "_id": "Shop.Orders.OrderService@Shop.Orders:OrderService.cs",
  "className": "OrderService",
  "namespace": "Shop.Orders",
  "project": "Shop.Orders",
  "solution": "Shop.sln",
  "layer": "Application",
  "type": "Service",
  "documentation": "Creates, prices and cancels orders.",
  "baseTypes": ["IOrderService"],
  "dependencies": [
    { "target": "OrderRepository", "project": "Shop.Data", "referenceType": "ProjectReference" }
  ],
  "methods": [
    {
      "methodName": "CancelOrderAsync",
      "returnType": "Task&lt;bool&gt;",
      "parameters": [{ "name": "orderId", "type": "int" }],
      "storedProcedures": ["usp_CancelOrder"],
      "cyclomaticComplexity": 4,
      "linesOfCode": 21
    }
  ]
}</pre>

      <h3>Dependencies from the semantic model</h3>
      <p>For every identifier in a class, ask the semantic model which type it refers to. Framework types are skipped, and only types defined in the solution's own projects are kept, labelled as same-project or cross-project references:</p>
      <pre class="language-csharp">
foreach (var id in cls.DescendantNodes().OfType&lt;IdentifierNameSyntax&gt;())
{
    // Ask the semantic model what this name actually refers to
    if (model.GetSymbolInfo(id).Symbol is not INamedTypeSymbol type) continue;
    if (type.ContainingNamespace?.ToString().StartsWith("System") == true) continue;

    // Keep only types that live in this solution's own projects
    var owner = solution.Projects.FirstOrDefault(p =&gt; p.AssemblyName == type.ContainingAssembly?.Name);
    if (owner is null) continue;

    deps.TryAdd($"{type.Name}:{owner.Name}", new DependencyInfo
    {
        Target = type.Name,
        Project = owner.Name,
        ReferenceType = owner.AssemblyName == model.Compilation.Assembly.Name
            ? "SameProject" : "ProjectReference",
    });
}</pre>
      <p>That turns "what does this class depend on?" into an exact answer across project boundaries, which plain text search cannot give.</p>

      <h3>Stored procedures, found where they are named</h3>
      <p>In data-heavy .NET code, stored procedure names usually appear as string literals passed to <code>SqlCommand</code> or Dapper. Scanning each method's string literals for procedure-style names links C# methods to database logic, and that link powers tools like "who calls this procedure?":</p>
      <pre class="language-csharp">
var names = method.DescendantNodes()
    .OfType&lt;LiteralExpressionSyntax&gt;()
    .Where(l =&gt; l.IsKind(SyntaxKind.StringLiteralExpression))
    .Select(l =&gt; l.Token.ValueText)
    .Where(s =&gt; Regex.IsMatch(s, @"^(sp_|usp_|proc_)[A-Za-z0-9_]+$", RegexOptions.IgnoreCase))
    .Distinct();</pre>

      <h3>Complexity and size</h3>
      <p>Cyclomatic complexity is 1 plus the number of decision points. With a syntax tree that is a count of node types. Lines of code skip blanks and comments. Together they let an assistant answer "where are the riskiest methods?":</p>
      <pre class="language-csharp">
int complexity = 1
    + method.DescendantNodes().OfType&lt;IfStatementSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;WhileStatementSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;ForStatementSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;ForEachStatementSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;CaseSwitchLabelSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;CatchClauseSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;ConditionalExpressionSyntax&gt;().Count()
    + method.DescendantNodes().OfType&lt;BinaryExpressionSyntax&gt;()
          .Count(b =&gt; b.IsKind(SyntaxKind.LogicalAndExpression) || b.IsKind(SyntaxKind.LogicalOrExpression));</pre>

      <h3>Documentation, layer and type</h3>
      <p>XML doc comments come from the symbol (<code>GetDocumentationCommentXml()</code>) with the <code>&lt;summary&gt;</code> extracted. Layer and type are inferred from conventions: namespaces containing <code>.Api</code>, <code>.Application</code>, <code>.Infrastructure</code> or <code>.Domain</code>, and class names ending in <code>Controller</code>, <code>Service</code>, <code>Repository</code>, <code>Dto</code> or <code>Request</code>. Cheap heuristics, but they make questions like "list the infrastructure classes in project X" possible.</p>

      <h3>Method source, stored separately</h3>
      <p>The full source of every method is saved in its own collection, keyed by file and method name. Metadata documents stay small and fast to scan, and <code>get_method_source</code> can still hand the assistant the exact code when it needs it, instead of the assistant guessing at an implementation from its signature.</p>

      <h2>5. Step 3: Reading the Database Schema</h2>
      <p>SQL Server describes itself. <code>INFORMATION_SCHEMA.TABLES</code>, <code>COLUMNS</code>, <code>ROUTINES</code> and <code>PARAMETERS</code> give tables, columns, procedure definitions and parameters. The <code>sys.*</code> catalogue views fill in what the standard views don't cover, such as foreign keys and indexes:</p>
      <pre class="language-sql">
SELECT fk.name  AS ForeignKey,
       c.name   AS ColumnName,
       rt.name  AS ReferencedTable,
       rc.name  AS ReferencedColumn
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c  ON fkc.parent_object_id = c.object_id  AND fkc.parent_column_id = c.column_id
JOIN sys.tables  t  ON fk.parent_object_id = t.object_id
JOIN sys.tables  rt ON fk.referenced_object_id = rt.object_id
JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
WHERE t.name = @TableName;</pre>
      <p>With foreign keys and procedure definitions stored next to the code metadata, the assistant can follow a feature end to end: controller → service → stored procedure → tables → related tables.</p>

      <h2>6. Step 4: Storing the Map in MongoDB</h2>
      <p>Code metadata is naturally nested (class → methods → parameters) and its shape changes as the analyzer learns new tricks, so a document store fits better than a relational schema. Every write is an <strong>idempotent upsert</strong> keyed on a natural identity: class ID for classes, schema plus name for tables and procedures. Re-running a sync updates in place instead of duplicating:</p>
      <pre class="language-csharp">
var ops = tables.Select(t =&gt; new ReplaceOneModel&lt;TableSchema&gt;(
    Builders&lt;TableSchema&gt;.Filter.And(
        Builders&lt;TableSchema&gt;.Filter.Eq(x =&gt; x.Schema, t.Schema),
        Builders&lt;TableSchema&gt;.Filter.Eq(x =&gt; x.TableName, t.TableName)),
    t) { IsUpsert = true });

await collection.BulkWriteAsync(ops);   // one round trip, safe to re-run</pre>
      <p>One ordering detail matters: class metadata is saved <em>before</em> the database step runs. If the SQL server is unreachable, the code map is still updated, and a partial sync beats an all-or-nothing one.</p>

      <h2>7. Multi-Tenancy: One Server, Many Workspaces</h2>
      <p>One deployment serves several independent codebases. Each <strong>workspace</strong> is a document describing what to sync and how often:</p>
      <pre class="language-json">
{
  "name": "shop-platform",              // also the MongoDB database name
  "repositories": ["shop-api", "shop-admin"],
  "branch": "main",
  "dbConnectionString": "Server=…;Database=ShopDb;…",
  "dbName": "ShopDb",
  "syncFrequencyMinutes": 240,
  "status": "Pending",                  // Pending → Active → Pending | Failed | Disabled
  "lastRunUtc": "2026-09-23T04:00:00Z",
  "nextRunUtc": "2026-09-23T08:00:00Z"
}</pre>
      <p>Each workspace gets its <strong>own MongoDB database</strong>, named after the workspace, so data never mixes and removing a workspace is a single drop. A provisioner creates the database and its collections the first time a workspace syncs.</p>
      <p>At request time a scoped <code>TenantProvider</code> carries the workspace name taken from the URL, and every Mongo access resolves its database through it:</p>
      <pre class="language-csharp">
public class TenantProvider : ITenantProvider   // registered as Scoped
{
    public string? DatabaseName { get; set; }
}

public IMongoDatabase GetDatabase() =&gt;
    _client.GetDatabase(_tenant.DatabaseName ?? _settings.DefaultDatabase);

[HttpPost("{workspace}/mcp")]
public async Task Mcp(string workspace)
{
    _tenant.DatabaseName = workspace;   // every query in this request now targets that workspace
    …
}</pre>
      <p>The MCP URL itself selects the workspace: <code>https://host/shop-platform/mcp</code> and <code>https://host/billing/mcp</code> are two different code maps behind the same server.</p>

      <h2>8. Scheduling Syncs</h2>
      <p>A single <code>BackgroundService</code> wakes every minute, finds workspaces that are due, and runs them one by one with a small state machine: <em>Pending → Active → Pending</em>, or <em>Failed</em> on error, with <em>Disabled</em> to pause one:</p>
      <pre class="language-csharp">
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        using var scope = _scopeFactory.CreateScope();
        var configs = await scope.ServiceProvider
            .GetRequiredService&lt;IWorkspaceConfigService&gt;().GetAllAsync();

        foreach (var cfg in configs.Where(c =&gt; c.Status != Status.Disabled
                                            &amp;&amp; (c.NextRunUtc is null || c.NextRunUtc &lt;= DateTime.UtcNow)))
        {
            try
            {
                await MarkAsync(cfg, Status.Active);
                await _provisioner.ProvisionAsync(cfg);          // create database + collections if new
                await RunSyncForWorkspaceAsync(cfg, stoppingToken);
                cfg.LastRunUtc = DateTime.UtcNow;
                cfg.NextRunUtc = cfg.LastRunUtc.Value.AddMinutes(cfg.SyncFrequencyMinutes);
                await MarkAsync(cfg, Status.Pending);
            }
            catch (Exception ex)
            {
                await MarkAsync(cfg, Status.Failed);             // one bad workspace doesn't stop the others
                _logger.LogError(ex, "Workspace {Name} failed", cfg.Name);
            }
        }

        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
    }
}</pre>

      <h3>An isolated container per sync</h3>
      <p>The subtle part: each workspace has its own repositories, access token and source database, but the sync services read their settings through <code>IOptions&lt;T&gt;</code>. Rather than mutate app-wide singletons (and race with the next workspace), each run builds a <strong>fresh, short-lived DI container</strong> with that workspace's options baked in:</p>
      <pre class="language-csharp">
var services = new ServiceCollection();
services.AddLogging();
services.AddSingleton(Options.Create(new RepositorySettings
{
    Repositories = cfg.Repositories,
    Branch = cfg.Branch,
    AccessToken = cfg.AccessToken ?? defaults.AccessToken,
}));
services.AddSingleton(Options.Create(new DatabaseSettings
{
    ConnectionString = cfg.DbConnectionString,     // source SQL database
    Databases = [cfg.DbName],
}));
services.AddSingleton(Options.Create(new MongoDbSettings
{
    ConnectionString = defaults.MongoConnectionString,
    DatabaseName = cfg.Name,                       // destination: this workspace's database
}));
services.AddScoped&lt;ICodeAnalyzerService, CodeAnalyzerService&gt;();
services.AddScoped&lt;ISchemaExtractorService, SchemaExtractorService&gt;();
services.AddScoped&lt;IMetadataSyncService, MetadataSyncService&gt;();
// …the rest of the sync pipeline

using var provider = services.BuildServiceProvider();
await provider.GetRequiredService&lt;IMetadataSyncService&gt;().SyncAsync(ct);</pre>
      <p>The pipeline code stays unaware of tenants: it just reads its options. The container is disposed when the run ends, taking the per-workspace credentials with it.</p>

      <h2>9. Speaking MCP</h2>
      <p>MCP is JSON-RPC 2.0. A client sends <code>initialize</code> to learn the server's capabilities, <code>tools/list</code> to discover tools with their JSON Schemas, and <code>tools/call</code> to run one. The endpoint accepts POSTs and answers in the Streamable HTTP style as server-sent events, with standard JSON-RPC error codes (<code>-32700</code> parse error, <code>-32601</code> unknown method, <code>-32603</code> internal error):</p>
      <pre class="language-csharp">
switch (request.Method)
{
    case "initialize":
        await Send(new { protocolVersion = "2024-11-05",
                         capabilities = new { tools = new { } },
                         serverInfo = new { name = "code-intelligence", version = "1.0.0" } });
        break;

    case "tools/list":
        await Send(new { tools = ToolDefinitions.GetAll()
            .Select(t =&gt; new { name = t.Name, description = t.Description, inputSchema = t.InputSchema }) });
        break;

    case "tools/call":
        var result = await _executor.ExecuteAsync(toolName, args);
        // MCP wants a content array; the structured result travels as JSON text
        await Send(new { content = new[] { new { type = "text", text = JsonSerializer.Serialize(result) } } });
        break;

    default:
        await SendError(-32601, $"Unknown method: {request.Method}");
        break;
}</pre>

      <h3>Tools as data</h3>
      <p>Each tool is declared once, with a name, a description written for the model and a JSON Schema for its arguments. The descriptions matter more than they look: they are the only documentation the assistant reads before choosing a tool.</p>
      <pre class="language-csharp">
new ToolDefinition(
    "find_method",
    "Search for methods across all classes",
    Schema(new()
    {
        ["methodName"] = ("string",  "The name of the method to find"),
        ["className"]  = ("string",  "Filter by class name"),
        ["limit"]      = ("integer", "Max results to return (default 50)"),
    }))</pre>
      <p>A single executor maps tool names to handlers with a <code>switch</code> expression:</p>
      <pre class="language-csharp">
public Task&lt;object&gt; ExecuteAsync(string tool, Dictionary&lt;string, object&gt; args) =&gt; tool switch
{
    "find_class"                      =&gt; FindClassAsync(args),
    "find_method"                     =&gt; FindMethodAsync(args),
    "get_method_source"               =&gt; GetMethodSourceAsync(args),
    "search_stored_procedures"        =&gt; SearchStoredProceduresAsync(args),
    "get_class_dependencies"          =&gt; GetClassDependenciesAsync(args),
    "get_table_schema"                =&gt; GetTableSchemaAsync(args),
    "get_table_relationships"         =&gt; GetTableRelationshipsAsync(args),
    "find_stored_procedures_by_table" =&gt; FindStoredProceduresByTableAsync(args),
    "class_count_by_layer"            =&gt; ClassCountByLayerAsync(args),
    // …40-odd more
    _ =&gt; throw new InvalidOperationException($"Unknown tool: {tool}"),
};</pre>
      <p>The catalogue is grouped by the questions developers actually ask:</p>
      <ul>
        <li><strong>Search:</strong> <code>find_class</code>, <code>find_method</code>, <code>find_dto</code>, <code>search_by_namespace</code>, <code>search_class_name</code>.</li>
        <li><strong>Method analysis:</strong> <code>get_method_signature</code>, <code>get_method_source</code>, <code>list_class_methods</code>, <code>find_methods_by_return_type</code>, <code>trace_method_calls</code>.</li>
        <li><strong>Structure:</strong> <code>get_project_structure</code>, <code>get_layer_analysis</code>, <code>list_solutions</code>, <code>list_projects</code>, <code>get_class_dependencies</code>.</li>
        <li><strong>Database:</strong> <code>get_table_schema</code>, <code>get_table_relationships</code>, <code>get_table_foreign_keys</code>, <code>get_stored_procedure</code>, <code>get_sp_parameters</code>, <code>find_stored_procedures_by_table</code>.</li>
        <li><strong>Code ↔ database:</strong> <code>search_stored_procedures</code> finds the C# methods that call a procedure.</li>
        <li><strong>Statistics:</strong> <code>count_classes</code>, <code>class_count_by_layer</code>, <code>top_classes_by_method_count</code>, <code>top_tables_by_size</code>.</li>
      </ul>
      <p>Arguments arrive as <code>JsonElement</code>s or primitives depending on the client, so handlers read them tolerantly (accepting either form, with sensible defaults such as a 50-result limit) instead of failing on a type mismatch.</p>

      <h3>What it looks like in use</h3>
      <pre>
You:        Which methods call usp_CancelOrder, and what does that procedure touch?

Assistant → search_stored_procedures { "storedProcName": "usp_CancelOrder" }
          ← OrderService.CancelOrderAsync, AdminOrderController.ForceCancel
Assistant → get_stored_procedure     { "name": "usp_CancelOrder" }
          ← definition + parameters (@OrderId int, @Reason nvarchar(200))
Assistant → get_table_relationships  { "tableName": "Orders" }
          ← FK Orders.CustomerId → Customers.Id, OrderLines.OrderId → Orders.Id

Assistant:  Two callers use it… it updates Orders and OrderLines, so cancelling
            also affects any report that joins OrderLines. Here is the method source…</pre>
      <p>Three small, precise tool calls replace pasting a dozen files into the chat, and the answer is grounded in what the compiler and the database actually say.</p>

      <h2>10. Operating It</h2>
      <h3>Settings in MongoDB, with a file fallback</h3>
      <p>Repository credentials, database connections and access keys can change without a redeploy. A tiny custom <code>IOptions&lt;T&gt;</code> starts with the value from <code>appsettings.json</code> and is overwritten from MongoDB at startup if a stored value exists, so every service keeps using ordinary options injection:</p>
      <pre class="language-csharp">
public class MongoOptionsProvider&lt;T&gt; : IOptions&lt;T&gt; where T : class, new()
{
    private T? _value;
    public MongoOptionsProvider(T fallback) =&gt; _value = fallback;   // from appsettings.json
    public void SetValue(T? value) { if (value != null) _value = value; }
    public T Value =&gt; _value ?? new T();
}

// Program.cs: register with the appsettings value, then overwrite from MongoDB at startup
var repoSettings = new MongoOptionsProvider&lt;RepositorySettings&gt;(
    builder.Configuration.GetSection("Repositories").Get&lt;RepositorySettings&gt;() ?? new());
builder.Services.AddSingleton&lt;IOptions&lt;RepositorySettings&gt;&gt;(repoSettings);
…
repoSettings.SetValue(await settingsService.GetRepositorySettingsAsync());</pre>
      <p>The settings API masks secrets on read: passwords in connection strings are replaced with asterisks, and access keys show only their first four characters.</p>

      <h3>Live logs in the dashboard</h3>
      <p>A sync over a big solution takes minutes, and watching it helps. A custom Serilog sink raises an event for every log line; the Blazor Server dashboard subscribes and appends lines as they arrive, with no polling and no extra infrastructure:</p>
      <pre class="language-csharp">
public class LogSink(LogStreamingService stream) : ILogEventSink
{
    public void Emit(LogEvent e) =&gt;
        stream.Broadcast($"[{e.Timestamp:HH:mm:ss}] [{e.Level.ToString()[..3].ToUpper()}] {e.RenderMessage()}");
}

public class LogStreamingService
{
    public event Action&lt;string&gt;? OnLogReceived;
    public void Broadcast(string line) =&gt; OnLogReceived?.Invoke(line);
}

// Program.cs
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.Sink(new LogSink(logStreaming))   // the dashboard subscribes to OnLogReceived
    .WriteTo.File("logs/sync-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();</pre>
      <p>A singleton status service does the same for sync state (running, last duration, classes, tables and procedures found, next run), raising <code>OnChange</code> so the dashboard re-renders the moment a sync starts or finishes.</p>

      <h3>Access</h3>
      <p>The dashboard uses cookie authentication with access keys that can be managed at runtime, and a small middleware logs each request's client IP (honouring <code>X-Forwarded-For</code>), user agent and an optional device header for auditing.</p>

      <h2>11. What's Next</h2>
      <ul>
        <li><strong>A true call graph.</strong> Class-level dependencies are exact today. Resolving every invocation inside each method (Roslyn's <code>SymbolFinder</code> can do this) would make "who calls this method?" as precise as "what does this class use?".</li>
        <li><strong>Semantic search.</strong> Embedding method source and documentation next to the structured metadata would add "find the code that handles refunds" alongside exact-name lookups: RAG over code, grounded by the same map.</li>
        <li><strong>Incremental syncs.</strong> Re-analysing only the files changed since the last commit instead of the whole solution.</li>
        <li><strong>Secrets at rest.</strong> Encrypting stored tokens and connection strings, or moving them to a secret store.</li>
      </ul>

      <h2>12. Takeaways</h2>
      <ul>
        <li><strong>Give assistants a map, not a pile of files.</strong> Precomputed, structured metadata beats pasting code into a prompt.</li>
        <li><strong>Use the compiler.</strong> Roslyn's semantic model answers "what does this refer to?" exactly; text search can only guess.</li>
        <li><strong>Link code to data.</strong> Connecting methods to stored procedures to tables is where the biggest questions get answered.</li>
        <li><strong>Make syncs idempotent and partial-failure tolerant.</strong> Upserts, a temp directory per run, per-repository error isolation, and saving code before touching the database.</li>
        <li><strong>Isolate tenants by construction.</strong> A database per workspace, a scoped tenant from the URL, and a fresh DI container per sync.</li>
      </ul>
    `
  },
  {
    slug: "dotnet-dynamic-background-service-manager",
    title: "A Dynamic Background Service Manager in .NET 8: Start, Update and Stop Workers at Runtime",
    excerpt: "How a small .NET 8 console app runs any number of named background workers, each with its own interval and config, and lets you start, retune and stop them while it runs, using async loops, CancellationToken and a ConcurrentDictionary.",
    date: "September 23, 2026",
    readTime: "5 min read",
    category: "Software Architecture",
    tags: [".NET Core", "C#", "Background Services", "Concurrency", "Async"],
    content: `
      <p class="lead">Most .NET background work is fixed when the app starts: you register a <code>BackgroundService</code> and it runs until shutdown. This project takes a different approach: a small .NET 8 console app that starts, reconfigures and stops any number of named background workers <strong>while it is running</strong>, from simple typed commands.</p>

      <h2>1. What It Does</h2>
      <p>The app prints a prompt and accepts five commands:</p>
      <ul>
        <li><code>START &lt;id&gt; &lt;interval-ms&gt; &lt;config&gt;</code> starts a new worker that runs every <em>interval</em> milliseconds with its own config value.</li>
        <li><code>UPDATE &lt;id&gt; &lt;interval-ms&gt; &lt;config&gt;</code> changes a running worker's interval and config without restarting it.</li>
        <li><code>STOP &lt;id&gt;</code> cancels one worker.</li>
        <li><code>LIST</code> shows every running worker and its current settings.</li>
        <li><code>EXIT</code> quits.</li>
      </ul>
      <p>That makes the number and pace of workers <em>data</em>, not code, which suits per-tenant pollers, sync jobs you switch on and off, or scheduled tasks whose frequency changes at runtime.</p>

      <h2>2. How the Code Is Organised</h2>
      <p>Three files, each with one job:</p>
      <pre>
Service&amp;Instances/
├── Program.cs          console loop: reads and parses commands
├── Service.cs          MyBackgroundService + ConfigData: one worker
└── ServiceManager.cs   BackgroundServiceManager: owns all workers</pre>

      <h2>3. The Worker: MyBackgroundService</h2>
      <p>Each worker carries its settings in a small <code>ConfigData</code> class: how often to run, and a custom value standing in for whatever real settings a job would need.</p>
      <pre class="language-csharp">
public class ConfigData
{
    public int Interval { get; set; } = 5000;  // Default interval in milliseconds
    public string CustomValue { get; set; } = "DefaultConfig";
}</pre>
      <p>The worker itself is an async loop. It does its work (here, a log line), then waits for the interval with <code>Task.Delay</code>, and repeats until its <code>CancellationTokenSource</code> is cancelled:</p>
      <pre class="language-csharp">
private CancellationTokenSource _cts;
private string _serviceId;
private ConfigData _config;

public MyBackgroundService(string serviceId, ConfigData config)
{
    _serviceId = serviceId;
    _config = config;
    _cts = new CancellationTokenSource();
}

public async Task StartAsync()
{
    Console.WriteLine($"Service {_serviceId} started. Interval: {_config.Interval} ms, Config: {_config.CustomValue}");

    while (!_cts.Token.IsCancellationRequested)
    {
        Console.WriteLine($"Service {_serviceId} is running with config: {_config.CustomValue}");
        await Task.Delay(_config.Interval, _cts.Token);
    }

    Console.WriteLine($"Service {_serviceId} stopped.");
}

public void Stop()
{
    _cts.Cancel();
}

public void UpdateConfig(ConfigData newConfig)
{
    _config = newConfig;
    Console.WriteLine($"Service {_serviceId} updated: Interval={_config.Interval} ms, Config={_config.CustomValue}");
}</pre>
      <p>Three details make it work:</p>
      <ul>
        <li><strong>Cancellation instead of flags.</strong> The loop checks <code>_cts.Token.IsCancellationRequested</code>, and the same token is passed to <code>Task.Delay</code>, so <code>Stop()</code> also interrupts a worker that is in the middle of waiting.</li>
        <li><strong>Config is read on every pass.</strong> <code>UpdateConfig</code> just replaces <code>_config</code>. The loop reads <code>_config</code> each time round, so the next pass picks up the new value and interval.</li>
        <li><strong>Async, not threads.</strong> While a worker waits it holds no thread, so hundreds of workers cost almost nothing when idle.</li>
      </ul>

      <h2>4. The Manager: BackgroundServiceManager</h2>
      <p>The manager owns all workers in a <code>ConcurrentDictionary</code> keyed by id. Each entry stores the worker together with its current config, so <code>LIST</code> can report settings without asking every worker.</p>
      <pre class="language-csharp">
public class BackgroundServiceManager
{
    private readonly ConcurrentDictionary&lt;string, (MyBackgroundService, ConfigData)&gt; _services;

    public BackgroundServiceManager()
    {
        _services = new ConcurrentDictionary&lt;string, (MyBackgroundService, ConfigData)&gt;();
    }

    public string StartService(string serviceId, ConfigData config)
    {
        if (_services.ContainsKey(serviceId))
        {
            return $"Service {serviceId} is already running.";
        }

        var service = new MyBackgroundService(serviceId, config);
        _services.TryAdd(serviceId, (service, config));

        Task.Run(() =&gt; service.StartAsync());

        return $"Service {serviceId} started.";
    }

    public string StopService(string serviceId)
    {
        if (_services.TryRemove(serviceId, out var serviceTuple))
        {
            serviceTuple.Item1.Stop();
            return $"Service {serviceId} stopped.";
        }

        return $"Service {serviceId} not found.";
    }

    public string UpdateServiceConfig(string serviceId, ConfigData newConfig)
    {
        if (_services.TryGetValue(serviceId, out var serviceTuple))
        {
            serviceTuple.Item1.UpdateConfig(newConfig);
            _services[serviceId] = (serviceTuple.Item1, newConfig); // Update config in dictionary
            return $"Service {serviceId} updated with new config.";
        }

        return $"Service {serviceId} not found.";
    }

    public Dictionary&lt;string, ConfigData&gt; GetRunningServices()
    {
        return _services.ToDictionary(k =&gt; k.Key, v =&gt; v.Value.Item2);
    }
}</pre>
      <ul>
        <li><strong>StartService</strong> refuses a duplicate id, creates the worker, records it, and starts its loop on the thread pool with <code>Task.Run</code>. It returns straight away, so the prompt stays responsive.</li>
        <li><strong>StopService</strong> removes the entry and cancels the worker in one step with <code>TryRemove</code>.</li>
        <li><strong>UpdateServiceConfig</strong> pushes the new config into the running worker and updates the stored copy.</li>
        <li><strong>GetRunningServices</strong> returns a snapshot, a plain dictionary copy, so the caller can loop over it while workers are added or removed.</li>
      </ul>

      <h2>5. The Command Loop</h2>
      <p><code>Program.cs</code> reads a line, splits it on spaces and switches on the first word. Each branch validates its arguments and calls the manager. Here is <code>START</code>:</p>
      <pre class="language-csharp">
case "START":
    if (parts.Length &lt; 4)
    {
        Console.WriteLine("Usage: START &lt;ServiceID&gt; &lt;Interval(ms)&gt; &lt;ConfigValue&gt;");
        break;
    }

    string serviceId = parts[1];
    if (!int.TryParse(parts[2], out int interval))
    {
        Console.WriteLine("Invalid interval.");
        break;
    }

    string configValue = parts[3];
    ConfigData config = new ConfigData { Interval = interval, CustomValue = configValue };
    Console.WriteLine(serviceManager.StartService(serviceId, config));
    break;</pre>
      <p>A typical session:</p>
      <pre>
Dynamic Background Service Manager
Available Commands: START &lt;id&gt; &lt;interval&gt; &lt;config&gt;, STOP &lt;id&gt;, UPDATE &lt;id&gt; &lt;interval&gt; &lt;config&gt;, LIST, EXIT

Enter command: START a 1000 hello
Service a started.
Service a started. Interval: 1000 ms, Config: hello
Service a is running with config: hello
Service a is running with config: hello

Enter command: UPDATE a 200 fast
Service a updated: Interval=200 ms, Config=fast
Service a updated with new config.
Service a is running with config: fast
Service a is running with config: fast

Enter command: LIST
Running Services:
- a: Interval=200, Config=fast

Enter command: STOP a
Service a stopped.</pre>

      <h2>6. Taking It Further</h2>
      <p>The console is only one front end. Ideas for a production version:</p>
      <ul>
        <li><strong>Expose it as an API.</strong> Register <code>BackgroundServiceManager</code> as a singleton in ASP.NET Core and map <code>POST</code>, <code>PUT</code>, <code>DELETE</code> and <code>GET</code> endpoints to start, update, stop and list, so other systems can control workers.</li>
        <li><strong>Stop cleanly on shutdown.</strong> An <code>IHostedService</code> can stop every worker when the app exits, and the manager can keep each worker's task so a stop can wait for it to finish.</li>
        <li><strong>Apply updates immediately.</strong> A new interval takes effect after the current wait ends; cancelling the current <code>Task.Delay</code> with a second "wake" token applies it at once.</li>
        <li><strong>Treat stopping as normal.</strong> <code>Task.Delay</code> throws <code>OperationCanceledException</code> when cancelled; catching it (with cleanup in <code>finally</code>) lets the worker log its own "stopped" line.</li>
        <li><strong>Guard concurrent starts.</strong> Using the return value of <code>TryAdd</code> as the duplicate check keeps two simultaneous <code>START</code>s from both launching a worker.</li>
        <li><strong>Persist the workers.</strong> Save ids and configs to a database so workers come back after a restart.</li>
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
