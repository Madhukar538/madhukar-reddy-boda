# C# Code RAG & Roslyn MCP Server: Architecture Blueprint & Research Specification

> **Project Working Title:** `csharp-code-intel-mcp`  
> **Target Runtime:** .NET 9 / .NET 10 (C# 13)  
> **Author:** Boda Madhukar Reddy  
> **Status:** Proposal & Research Phase  

---

## 1. Executive Summary & Vision

Modern AI coding assistants (Claude Desktop, Cursor, Antigravity, GitHub Copilot) excel at localized code generation and refactoring in the open buffer. However, they struggle in large multi-project enterprise solutions ($40+$ projects, thousands of classes, complex dependency graphs, and database interdependencies).

Naive RAG approaches (splitting code by fixed-length token windows or line counts) destroy syntax boundaries, tear apart control flow, and hallucinate callers and types.

This project designs a **standalone, high-throughput developer tool** that:
1. Parses C# solutions via **Roslyn (`Microsoft.CodeAnalysis`)** to extract compile-time semantic maps (classes, methods, DI dependencies, cyclomatic complexity, and embedded SQL procedure literals).
2. Generates **syntactically aligned vector embeddings** in-process via **ONNX Runtime** (zero cloud API round-trips).
3. Exposes the structured codebase map and semantic retrieval engine to AI assistants via the **Model Context Protocol (MCP)** using `stdio` and `Streamable HTTP`.

```
┌─────────────────────────────────────────────────────────────┐
│                      Source Codebase                        │
│             (.sln / .csproj / single .cs files)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Roslyn Compilation Pipeline                 │
│        Syntax Trees ───▶ Semantic Model ───▶ Symbols        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
    Structured Metadata                       Method Chunks
    • Classes & Interfaces                    • Full method source
    • Injected Dependencies                   • Docstrings (<summary>)
    • Stored Proc calls (usp_*)               • Parameters & returns
    • Cyclomatic Complexity                   • Call signatures
                │                             │
                │                             ▼
                │             ┌───────────────────────────────┐
                │             │  In-Process ONNX Embedder     │
                │             │  (all-MiniLM-L6-v2 / 384 dim) │
                │             └───────────────┬───────────────┘
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Hybrid Code Intelligence Index                │
│    (Symbol Hash Maps + In-Memory / SQLite Vector Store)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Model Context Protocol (MCP)                │
│         JSON-RPC 2.0 Engine over stdio / Streamable HTTP    │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌───────────────┐                             ┌───────────────┐
│ Claude / IDE  │                             │ Cursor / Agent│
└───────────────┘                             └───────────────┘
```

---

## 2. Problem Statement: Why Naive Code RAG Fails

| Dimension | Naive Text RAG (Chunk by 500 Tokens) | Roslyn Code Intelligence + Semantic RAG |
| :--- | :--- | :--- |
| **Boundary Integrity** | Cuts methods midway through loops or try/catch blocks. | Chunks strictly at class, interface, and method boundaries. |
| **Type Resolution** | Treats `Order` (class), `Order` (table), and `order` (var) as identical text. | Uses Roslyn's `SemanticModel.GetSymbolInfo()` to bind exact assembly types. |
| **Cross-Project Scope** | Cannot trace that `IOrderService` resolves to `OrderService` in another project. | Traces project-to-project references across `.sln` dependency graphs. |
| **Database Ties** | Blind to SQL string literals inside Dapper or ADO.NET calls. | Extracts SQL stored procedure names (`sp_*`, `usp_*`) and links them to C# callers. |
| **Cost & Latency** | Calls external OpenAI/Anthropic APIs for every embed and query. | 100% local in-process ONNX inference ($<10\text{ ms}$ per query, zero API fees). |

---

## 3. Architecture & Project Layout

```
csharp-code-intel-mcp/
├── src/
│   ├── CodeIntel.Core/                # Roslyn AST, Semantic Models & SyntaxWalkers
│   │   ├── Analysis/
│   │   │   ├── SolutionAnalyzer.cs    # MSBuildWorkspace loader
│   │   │   ├── ClassVisitor.cs        # Class, interface, DI extractor
│   │   │   ├── MethodVisitor.cs       # Method signatures, returns, LOC
│   │   │   ├── ComplexityCalculator.cs# Cyclomatic complexity decision counter
│   │   │   └── SqlLiteralScanner.cs   # Regex scanner for usp_* and sp_* literals
│   │   ├── Models/
│   │   │   ├── ClassMetadata.cs
│   │   │   ├── MethodMetadata.cs
│   │   │   └── CodeRelationship.cs
│   │   └── Embeddings/
│   │       ├── OnnxEmbeddingEngine.cs # In-process all-MiniLM-L6-v2 ONNX runner
│   │       └── FastTokenizer.cs       # Bert WordPiece tokenizer
│   │
│   ├── CodeIntel.Storage/             # Fast symbol index & vector store
│   │   ├── InMemoryIndex.cs           # Lightning fast for single files or small repos
│   │   ├── SqliteVectorStore.cs       # Persistent disk cache with sqlite-vec
│   │   └── Search/
│   │       └── HybridCodeSearch.cs    # BM25 symbol matching + Cosine Vector search
│   │
│   ├── CodeIntel.McpServer/           # MCP protocol & tool implementations
│   │   ├── ServerHost.cs              # Protocol initialization & capabilities
│   │   ├── Tools/
│   │   │   ├── FindClassTool.cs
│   │   │   ├── GetMethodSourceTool.cs
│   │   │   ├── TraceDependenciesTool.cs
│   │   │   ├── SearchStoredProcsTool.cs
│   │   │   ├── CodeMetricsTool.cs
│   │   │   └── SemanticSearchTool.cs
│   │   └── Transports/
│   │       ├── StdioTransport.cs      # For local AI agents (Claude Desktop, Cursor)
│   │       └── SseTransport.cs        # Streamable HTTP for network clients
│   │
│   └── CodeIntel.Cli/                 # Entry point CLI
│       ├── Program.cs
│       └── Commands/
│           ├── StartCommand.cs        # `csharp-intel start --sln ./App.sln`
│           ├── IndexCommand.cs        # `csharp-intel index --file ./Service.cs`
│           └── BenchmarkCommand.cs    # Measures indexing and retrieval latency
│
├── tests/
│   ├── CodeIntel.Core.Tests/
│   └── CodeIntel.Mcp.Tests/
├── samples/                           # Sample C# enterprise solution for tests
├── csharp-code-intel-mcp.sln
└── README.md
```

---

## 4. Roslyn Analysis Engine Specifications

### 4.1. Semantic Model Extraction
Unlike naive string manipulation, Roslyn splits code analysis into two stages:
1. **Syntax Tree:** Text structure (node is a `MethodDeclarationSyntax` or `InvocationExpressionSyntax`).
2. **Semantic Model:** Compiler conclusions (identifier `_orderRepo` binds to interface `Shop.Core.Interfaces.IOrderRepository`).

### 4.2. Cyclomatic Complexity Formula
Cyclomatic complexity determines how risky a method is. Calculated directly from AST descendant nodes:
$$\text{Complexity} = 1 + \sum (\text{If} + \text{While} + \text{For} + \text{ForEach} + \text{CaseSwitch} + \text{Catch} + \text{ConditionalExpression} + \text{LogicalAnd} + \text{LogicalOr})$$

### 4.3. SQL Stored Procedure Extraction
Enterprise .NET code frequently invokes stored procedures via Dapper or ADO.NET string literals.
* AST Scanner inspects `LiteralExpressionSyntax` where `SyntaxKind == StringLiteralExpression`.
* Matches procedure patterns: `/^(sp_|usp_|proc_)[A-Za-z0-9_]+$/i`.
* Establishes a bidirectional link: `C# Method ⟷ Stored Procedure`.

---

## 5. Core MCP Tools Catalog

AI assistants interact exclusively through tool calls. These 6 tools cover 95% of developer inquiries:

### 1. `find_class`
* **Purpose:** Locates a class or interface and inspects its high-level architectural role.
* **Arguments:**
  ```json
  { "name": "OrderService", "namespace": "Shop.Orders" }
  ```
* **Output:** Namespace, project, base types, injected constructor dependencies, and method summaries.

### 2. `get_method_source`
* **Purpose:** Retrieves the exact implementation of a method without dumping entire 2,000-line files into the LLM context.
* **Arguments:**
  ```json
  { "className": "OrderService", "methodName": "CancelOrderAsync" }
  ```
* **Output:** Complete method source, line numbers, cyclomatic complexity, and documentation comments.

### 3. `search_stored_procedures`
* **Purpose:** Answers "Who calls this database procedure?" from compiler evidence.
* **Arguments:**
  ```json
  { "storedProcName": "usp_CancelOrder" }
  ```
* **Output:** List of C# methods, controllers, and classes invoking that procedure.

### 4. `get_class_dependencies`
* **Purpose:** Traces what types a class relies on across same-project and external project references.
* **Arguments:**
  ```json
  { "className": "OrderService" }
  ```
* **Output:** Injected interfaces, concrete types, and external assemblies.

### 5. `find_high_complexity_methods`
* **Purpose:** Code review and risk analysis.
* **Arguments:**
  ```json
  { "threshold": 10, "limit": 10 }
  ```
* **Output:** Methods ranked by cyclomatic complexity, decision points, and lines of code.

### 6. `search_code_semantic` (Code RAG)
* **Purpose:** Natural language query matching against code docstrings and method intentions.
* **Arguments:**
  ```json
  { "query": "handles payment retries and exponential backoff", "topK": 5 }
  ```
* **Output:** Ranked method cards with cosine similarity scores and signature previews.

---

## 6. Integration Configuration

### Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "csharp-code-intel": {
      "command": "dotnet",
      "args": [
        "run",
        "--project",
        "/path/to/csharp-code-intel-mcp/src/CodeIntel.Cli",
        "--",
        "start",
        "--sln",
        "/path/to/YourSolution.sln"
      ]
    }
  }
}
```

### Cursor Configuration (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "csharp-intel": {
      "command": "csharp-intel",
      "args": ["start", "--sln", "./Backend.sln"]
    }
  }
}
```

---

## 7. Key Research Topics & Open Questions

> [!NOTE] Priority 1: Roslyn MSBuild Resolution on Linux / macOS
> Loading `.sln` and `.csproj` via `MSBuildWorkspace` requires finding the .NET SDK build tools (`Microsoft.Build.Locator`). Research how to make this bulletproof on both Linux and Windows environments when run as a standalone CLI tool.

> [!TIP] Priority 2: In-Process Embeddings Engine
> Test `Microsoft.ML.OnnxRuntime` with `all-MiniLM-L6-v2` (384 dims, ~80 MB model file) vs `bge-small-en-v1.5`. Benchmark tokenization throughput using `FastBertTokenizer` on C# source code.

> [!IMPORTANT] Priority 3: Method-Level vs Class-Level Chunking
> Evaluate whether embedding the full method body yields higher retrieval accuracy than embedding just the method signature + docstring + parameters. (Empirical testing suggests signature + docstring avoids noise from variable assignments).

> [!CAUTION] Priority 4: Incremental Re-indexing
> Solutions change during coding sessions. Research file system watchers (`FileSystemWatcher`) that invalidate and re-analyze only modified `.cs` syntax trees without reloading the entire solution.

---

## 8. Phased Roadmap

| Phase | Milestone | Deliverable |
| :--- | :--- | :--- |
| **Phase 1: Proof of Concept** | Single `.cs` file analyzer | CLI that takes a `.cs` file, parses AST, and dumps JSON metadata + complexity. |
| **Phase 2: MCP Stdio Server** | Claude Desktop connection | Expose `find_class`, `get_method_source`, and `search_stored_procedures` over `stdio`. |
| **Phase 3: Solution Support** | Multi-project `.sln` loader | MSBuildWorkspace integration with cross-project dependency resolution. |
| **Phase 4: Semantic Code RAG** | In-process ONNX embeddings | Semantic search over method comments and signatures. |
| **Phase 5: Packaging & Distribution** | `dotnet tool` / Docker | Publish as global .NET tool (`csharp-code-intel`). |

