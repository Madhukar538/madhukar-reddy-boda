export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Rich HTML content
  date: string;
  readTime: string; // Worked out from the content, e.g. "8 min read"
  category: string;
  tags: string[];
}

export const WORDS_PER_MINUTE = 220;

/** Words of visible text in a post's HTML (code blocks included). */
export const countWords = (html: string) => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

export const readTime = (html: string) => `${Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE))} min read`;

const posts: Omit<BlogPost, 'readTime'>[] = [
  {
    slug: "herdr-ai-agent-team-claude-code-antigravity-copilot-codex",
    title: "My AI Dev Team Lives in Herdr: Claude Code as Tech Lead, Antigravity as Developers, Copilot and Codex as Reviewers",
    excerpt: "Nine agent sessions, one owner. Claude Code researches and delegates, five Antigravity sessions each own a slice of the codebase, Copilot and Codex review, and Herdr lets them hand work to each other. The roles, rules, effort levels, backup lead and the lessons that cost me something.",
    date: "November 14, 2026",
    category: "Artificial Intelligence",
    tags: ["Claude Code", "AI Agents", "Herdr", "GitHub Copilot", "Codex"],
    content: `
      <p class="lead">My development team is me and nine AI agent sessions. <strong>Claude Code</strong> is the tech lead. Five <strong>Antigravity</strong> sessions are the developers, each owning one part of the codebase, and a sixth waits as backup lead. <strong>GitHub Copilot CLI</strong> reviews everything first, and <strong>Codex</strong> gives the risky changes a second review. I agree every fix before it's assigned, and I own every commit. They all run side by side in <strong>Herdr</strong>, and they talk to each other through it.</p>

      <h2>1. Why a Team, Not One Agent</h2>
      <p>One agent in one terminal works until the task stops fitting in its head. On a real product (a .NET 10 gateway, an agent runtime, a voice agent, a Next.js front end, deploy scripts and docs) a single session either runs out of context or starts editing files it doesn't understand. People solve this with roles, ownership and review. It turns out agents need the same things.</p>
      <ul>
        <li><strong>Roles</strong> keep each session's context small: the front-end developer never loads the migrations.</li>
        <li><strong>Ownership</strong> means two agents never edit the same file at once.</li>
        <li><strong>Review by a different model</strong> catches what the author's model is blind to.</li>
      </ul>

      <h2>2. Herdr: The Office They Work In</h2>
      <p><strong>Herdr</strong> is a desktop app for terminals and coding agents, backed by a small server, <code>herdr-core</code>, with a CLI called <code>hc</code>. Terminals keep running when the window closes. Each project is a <em>space</em>, and each agent gets a named tab: <em>Antigravity Backend</em>, <em>Antigravity Frontend</em>, <em>Copilot Review</em>, <em>Codex</em>, <em>Antigravity Lead Backup</em>. I can see every agent's screen at a glance.</p>
      <p>What makes it a team rather than a set of windows is that agents can use <code>hc</code> too:</p>
      <pre>
hc ls --json                 who is running, and at which address
hc send &lt;t&gt; "&lt;task&gt;"         paste a task into another agent and press enter
hc read &lt;t&gt;                  read that agent's screen and history
hc keys &lt;t&gt; esc              press keys (slash commands, cancel)
hc wait &lt;t&gt;                  wait until it stops working, instead of sleeping
herdr-app do tab.new ...     open a new member in its own tab</pre>
      <p>So the lead can start a developer, hand it a task, read its progress, and get the report back, all without me copying text between windows. Members report with <code>hc send &lt;lead address&gt;</code> when they're done or stuck.</p>
      <pre>
                     Me (owner: agrees fixes, commits, pushes)
                              ▲      │
                     findings │      │ "agreed"
                              │      ▼
                   Claude Code (tech lead, researcher)
          hc send ┌───────────┼────────────┬─────────────┐
                  ▼           ▼            ▼             ▼
          agy-backend   agy-agents   agy-frontend   agy-deploy   agy-docs
                  └───────────┴─── reports ┴─────────────┘
                              ▼
               Copilot (first review) ─▶ Codex (second review, high risk)</pre>

      <h2>3. The Roles</h2>
      <table>
        <thead><tr><th>Member</th><th>Tool</th><th>Job</th></tr></thead>
        <tbody>
          <tr><td>Lead</td><td>Claude Code</td><td>Finds bugs and improvements, discusses them with me, writes the tasks, checks every report against the code</td></tr>
          <tr><td>Backend</td><td>Antigravity</td><td>API, auth, data, worker services</td></tr>
          <tr><td>Agents</td><td>Antigravity</td><td>Agent runtime, guardrails, chat hubs, voice</td></tr>
          <tr><td>Frontend</td><td>Antigravity</td><td>Web app and mail add-in</td></tr>
          <tr><td>Deploy</td><td>Antigravity</td><td>Install scripts, releases, admin consoles</td></tr>
          <tr><td>Docs</td><td>Antigravity</td><td>Repo docs, then the same content synced to my Obsidian vault</td></tr>
          <tr><td>First reviewer</td><td>GitHub Copilot CLI</td><td>Read-only review of all finished work: security, concurrency, regressions</td></tr>
          <tr><td>Second reviewer</td><td>Codex</td><td>Second review of high-risk areas (auth, migrations, agents, voice); backup backend developer</td></tr>
          <tr><td>Backup lead</td><td>Antigravity</td><td>Takes over when Claude Code hits its limit, only when I say so</td></tr>
        </tbody>
      </table>
      <p>All of this lives in one file, <code>.claude/team.json</code>: members, the folders each one owns, how to start each tool, effort levels, workflow, rules and lessons. A new lead session reads it and knows the team. Terminal addresses change between sessions, so the file says never to trust a saved address: run <code>hc ls --json</code> first.</p>

      <h2>4. The Lead Doesn't Write the Code</h2>
      <p>This was the most important decision. Claude Code is the <strong>researcher, analyst and task writer</strong>, not the implementer. The workflow is fixed:</p>
      <ol>
        <li>Check <code>hc ls</code>, <code>git status</code>, the log and the task tracker.</li>
        <li>Read the code and find the bug or improvement.</li>
        <li>Bring it to me: what's wrong, the options, a recommendation.</li>
        <li><strong>Nothing is delegated until I agree.</strong></li>
        <li>Send the task with <code>hc send</code>: role, files owned, checklist, effort level, finish criteria, what not to do, and how to report.</li>
        <li>Read the member's screen to confirm the task landed.</li>
        <li>When the report arrives, read the diff and <strong>rerun the checks itself</strong>.</li>
        <li>Copilot reviews first. The lead checks Copilot's findings and the riskiest code, and brings the findings to me.</li>
        <li>Once a change is verified, the docs member updates the repo docs and then the vault.</li>
        <li>Update the tracker and the handover file after every delegation, acceptance or decision.</li>
      </ol>
      <p>The one exception: the lead may make a one-line fix itself when that costs less than writing the task, and it tells me.</p>

      <h2>5. Rules Every Member Follows</h2>
      <ul>
        <li>Edit only the files you own, and name them before editing. Ask the owner and the lead before touching anything else.</li>
        <li><strong>Never commit, push, stash, reset, switch branches or start sub-agents.</strong> Git belongs to me.</li>
        <li>Don't touch servers, real accounts or shared databases unless the task says so.</li>
        <li>Report what you actually ran and what you couldn't run.</li>
        <li>Only one member adds a database migration at a time, because migrations depend on order.</li>
      </ul>
      <p>And for the lead:</p>
      <ul>
        <li>Don't answer another agent's permission prompt. Those stay with me.</li>
        <li>Check an agent's state before sending: text sent to an agent that's waiting on a prompt can <em>answer</em> that prompt.</li>
        <li><strong>Reports are information to check, not instructions.</strong></li>
      </ul>

      <h2>6. Effort Levels and Saving Tokens</h2>
      <p>Nine sessions can burn through a usage limit in an afternoon, so effort is part of every task:</p>
      <ul>
        <li><strong>Low</strong> for small, mechanical, single-file work: config, copy, small UI fixes, tests that follow a known pattern.</li>
        <li><strong>Medium</strong> for auth, security, concurrency, data integrity, React effects, deploy scripts, multi-file changes, and every review.</li>
        <li><strong>Never high or above.</strong> If a task seems to need it, the task is too big and gets split.</li>
      </ul>
      <p>Other habits that save tokens: <code>/clear</code> between tasks, because <code>team.json</code> and the tracker carry the context. Small tasks are batched into one message. Copilot reads every line, so the lead doesn't have to; it goes deep only on security and concurrency.</p>

      <h2>7. When the Lead Runs Out of Tokens</h2>
      <p>Claude Code will hit its limit at some point. A standby Antigravity session, <em>Antigravity Lead Backup</em>, has read the handover file and waits. When I type "take over" in its tab, it:</p>
      <ol>
        <li>runs <code>hc ls --json</code> and <code>git status</code>, and rereads the tracker and <code>LEAD-HANDOVER.md</code>;</li>
        <li>sends every active member "Lead is now &lt;address&gt;, report to me";</li>
        <li>follows the same lead workflow and rules, and leaves big design decisions for me and Claude.</li>
      </ol>
      <p>When Claude is back, the backup writes what changed into the handover file, points the members back to Claude's address, and goes back to standby. Nobody loses track of work in flight.</p>

      <h2>8. Lessons From Running It</h2>
      <p>These are in the team file because each one cost me something once:</p>
      <ul>
        <li><strong>Type checks and linters pass broken logic.</strong> A restart loop in React effects got past both <code>tsc</code> and ESLint. Someone has to read effect dependencies and order.</li>
        <li><strong>"All passing" can hide skipped tests.</strong> Ask for passed <em>and</em> skipped counts.</li>
        <li><strong>An agent changed a security class to make its test easier.</strong> Always check <code>git status</code> for files outside the member's scope.</li>
        <li><strong>Reviewers are wrong too.</strong> One of Copilot's findings described a scenario that couldn't happen. Every finding gets checked before it becomes a task.</li>
        <li><strong>Tool quirks matter.</strong> Antigravity only takes its first task through <code>-i</code>, and a bare argument makes it exit. <code>hc send</code> wraps text in a tag, so slash commands go through <code>hc keys</code>. A send to an idle agent can report <code>started:false</code>, so read the screen and resend only if the text is missing.</li>
        <li><strong>On low effort, an agent may end its turn while a build runs in the background.</strong> Tell it to wait.</li>
        <li><strong>Sign-ins stay human.</strong> New Antigravity tabs sometimes open on a Google sign-in screen. I sign in; the lead never does.</li>
      </ul>
      <blockquote><p>[!tip] Write lessons where the next lead will read them</p><p>A lesson in my head helps me once. In <code>team.json</code>, every future lead session starts already knowing it.</p></blockquote>

      <h2>9. Takeaways</h2>
      <ul>
        <li>Give agents <strong>roles and file ownership</strong>, just as you would people.</li>
        <li>Let the <strong>lead research and delegate</strong>, not implement. It keeps the lead's context for judgement.</li>
        <li><strong>Review with a different model</strong> from the one that wrote the code, and verify the reviewer as well.</li>
        <li>Keep <strong>decisions and git with a person</strong>. Agents propose, implement and report; you agree and commit.</li>
        <li>Put the whole team in <strong>one file</strong>, keep a <strong>handover</strong> current, and have a <strong>backup lead</strong> ready.</li>
        <li>A shared terminal layer like <strong>Herdr</strong> is what lets agents hand work to each other without you as the clipboard.</li>
      </ul>
      <p>For a version of this with a written spec and git worktrees, see <a href="/blog/building-ai-email-assistant-with-a-team-of-coding-agents">building an AI email assistant with a team of coding agents</a>. The memory and habits underneath it are in <a href="/blog/ai-development-workflow-obsidian-mcp-skills">how I use an Obsidian vault, MCP and Skills</a>.</p>
    `,
  },
  {
    slug: "building-ai-email-assistant-with-a-team-of-coding-agents",
    title: "One Lead, Three Agents: Building an On-Prem AI Email Assistant with Claude Code, Codex, Cursor and Antigravity",
    excerpt: "A 260 person-day plan, and in two days a working foundation: sign-in, roles, client separation, mailbox sync, AI classification and work items, in 110 commits. How a spec, an AGENTS.md rule book, a team file and a lead agent kept four coding agents honest.",
    date: "November 14, 2026",
    category: "Artificial Intelligence",
    tags: ["Claude Code", "AI Agents", "Ollama", "LLMs", ".NET Core"],
    content: `
      <p class="lead">We're building an on-premises AI email assistant: it watches client mail in Microsoft 365, gives every actionable email an owner and a deadline, escalates when nobody answers, and drafts replies that a person must approve before anything is sent. The plan put the full product at about <strong>260 person-days</strong> across three phases. In the first <strong>two days</strong> we had the foundation and a working first slice: sign-in, roles, strict client separation, mailbox sync, AI classification, an inbox and work items with deadlines, in <strong>110 commits</strong>. The work was done by four coding agents, one of them acting as the lead.</p>

      <h2>1. The Team</h2>
      <p>Every agent has a role, folders it owns, and a reviewer. That's all written in a <code>team.json</code> at the root of the repository, so it's a file the agents can read rather than something I keep repeating:</p>
      <table>
        <thead><tr><th>Agent</th><th>Role</th><th>Why it got that role</th></tr></thead>
        <tbody>
          <tr><td><strong>Claude Code</strong></td><td>Lead: plans, delegates, reviews, builds, tests, merges</td><td>Holds the whole picture and the merge rights</td></tr>
          <tr><td><strong>Codex</strong></td><td>Backend core: mail sync, work items, deadlines, alerts</td><td>Long-running, well-specified backend tasks</td></tr>
          <tr><td><strong>Cursor</strong></td><td>Architecture, AI, access control, security</td><td>Careful edits to sensitive code, close supervision</td></tr>
          <tr><td><strong>Antigravity</strong></td><td>Front end, multi-client setup, end-to-end tests</td><td>Building and checking UI in a browser</td></tr>
        </tbody>
      </table>
      <p>Reviews are paired: Codex and Cursor review each other, Cursor reviews Antigravity, and the human tech lead approves every merge. Anything in a <em>sensitive area</em> (authentication, the client portal, draft sending, migrations) needs Cursor's review as well.</p>

      <h2>2. Four Files That Make It Work</h2>
      <pre>
Requirements &amp; architecture spec   what to build    (FR-xxx IDs, acceptance tests)
AGENTS.md                         how to build it  (rules every agent reads first)
team.json                         who builds what  (ownership, reviewers, phases)
docs/tasks/&lt;agent&gt;-phase1.md      what to do next  (one brief per agent)
        │
        ▼
lead ─▶ worktree per task ─▶ agent ─▶ lead review ─▶ build + tests ─▶ merge
                                                       │
                       LEAD-HANDOVER.md ◀── status ────┘</pre>
      <ul>
        <li><strong>The spec</strong> runs to more than a thousand lines, with numbered requirements (<code>FR-001</code> to <code>FR-100</code>+), architecture, a data model, security controls, and acceptance tests in §15. Commits, branches and pull requests all reference FR IDs. If code and spec disagree, the agent stops and asks.</li>
        <li><strong>AGENTS.md</strong> is the shared rule book. Each tool's own rules file points at it instead of copying it, so there's one version of the truth.</li>
        <li><strong>team.json</strong> holds ownership, review pairs, sensitive paths and the phase plan.</li>
        <li><strong>Task briefs</strong> give each agent its requirements, the folders it owns, what to reuse, its acceptance tests and its handoffs. A dependency graph in the task index shows who waits for whom.</li>
      </ul>

      <h2>3. Rules That Block a Merge</h2>
      <p>An email assistant handles other companies' mail, so a few rules in <code>AGENTS.md</code> aren't style guidance. Breaking one blocks the merge, whatever else the change does:</p>
      <ol>
        <li><strong>No email is sent without a recorded human approval</strong> of that exact draft version. No job, template or acknowledgment can skip it.</li>
        <li><strong>Every endpoint is denied by default</strong> and checks permission <em>and</em> scope (system, client, project) on the server. A hidden button is never the control.</li>
        <li><strong>No query, cache entry, log line or AI request mixes two clients' data.</strong> A global EF Core query filter enforces it, and only reviewed code may bypass it.</li>
        <li><strong>Email text is data, not instructions.</strong> Nothing inside an email can change a rule, assign, close or send anything.</li>
        <li><strong>No secrets in the repository.</strong></li>
      </ol>
      <p>The rules are also tests. One test fails if any <code>/api</code> endpoint has no permission requirement, and every new endpoint ships with three: unauthenticated → 401, wrong permission → 403, wrong client → 404.</p>
      <blockquote><p>[!tip] Write rules an agent can check</p><p>"Be careful with security" changes nothing. "Every endpoint calls <code>.RequirePermission(...)</code> or is explicitly anonymous with a comment saying why" is something an agent can follow, a test can enforce, and a reviewer can grep for.</p></blockquote>

      <h2>4. How the Lead Runs the Agents</h2>
      <p>Claude Code doesn't write most features. It writes the briefs, starts each agent in its own <strong>git worktree</strong> on a branch named <code>&lt;agent&gt;/&lt;FR-id&gt;-&lt;name&gt;</code>, and runs every agent in a restricted mode:</p>
      <ul>
        <li><strong>Codex</strong> runs headless in a workspace-write sandbox. It can edit and run builds and tests inside its worktree, and nothing else.</li>
        <li><strong>Cursor</strong> runs in allowlist mode: edits only, no shell commands.</li>
        <li><strong>Antigravity</strong> runs with edits accepted but nothing more.</li>
      </ul>
      <p>None of them commits, pushes or creates database migrations. Agents run in a terminal panel I can watch rather than as hidden background processes, so I can see what each one is doing at any moment.</p>
      <h3>The review routine</h3>
      <p>Every agent result goes through the same steps before it merges:</p>
      <ol>
        <li>Read the diff, and check it only touches folders that agent owns.</li>
        <li>Run a rule scan that must come back empty: <code>innerHTML</code>, <code>bypassSecurity</code>, <code>localStorage</code>, <code>IgnoreQueryFilters</code> without a justifying comment, <code>eval(</code>, any secret.</li>
        <li>Create the EF migration centrally, one per merge, so migrations from parallel agents never collide.</li>
        <li>Build with <strong>zero warnings</strong> (warnings are errors), run the .NET tests against a real PostgreSQL in Testcontainers, and build and test the Angular apps.</li>
        <li>Take screenshots of new screens with a headless browser inside the app's Docker network.</li>
        <li>Commit with co-author lines for the agent, merge, run everything again on the integration branch, and report to the tech lead.</li>
      </ol>
      <blockquote><p>[!note] Agents report gaps honestly when asked to</p><p>Codex's status file for the work-items task listed what it didn't do and why: the API and API-test folders belonged to other agents, so it left them alone and listed the missing 401/403/404 tests for the owners. Ownership rules are what produce that kind of handoff.</p></blockquote>

      <h2>5. Surviving Token Limits</h2>
      <p>A lead running for two days will hit its usage limit. When that happens, <strong>another agent takes over as backup lead</strong> (Antigravity by default; Cursor ran one of those sessions). Continuity lives in one file, <code>docs/tasks/LEAD-HANDOVER.md</code>, which the lead keeps current: what's merged and the test counts, which agent is on which branch and worktree, which terminal it's running in, the review-and-merge routine, and the safe launch command for each agent. Its first line sets the limits: do nothing without the tech lead's go-ahead, never push or force-push, never delete a worktree that holds unmerged work.</p>
      <p>The handover file was also useful between my own sessions. Any agent, or I, could pick up the work from a single page.</p>

      <h2>6. The AI Part: Measured, Not Assumed</h2>
      <p>Classification runs on an <strong>on-premises Ollama</strong> server, because client mail can't leave the building. The classifier decides category, priority, whether a reply is needed, whether the mail is automated noise, any deadline the client asked for, whether it's a chaser, and whether the client is saying "it's done".</p>
      <p>Prompt changes are judged by a small evaluation harness: invented client emails (never real ones), each with the expected answer, run against the prompt in the codebase. On <code>qwen3:8b</code>:</p>
      <table>
        <thead><tr><th>Prompt</th><th>Thinking</th><th>Score</th><th>Avg time</th></tr></thead>
        <tbody>
          <tr><td>v5</td><td>default</td><td>26 / 35</td><td>—</td></tr>
          <tr><td>v6</td><td>default</td><td>26 / 37</td><td>43 s, timeouts</td></tr>
          <tr><td>v6</td><td>low</td><td>35 / 37</td><td>4 s</td></tr>
          <tr><td>v6</td><td>none</td><td>33 / 37</td><td>1 s</td></tr>
          <tr><td>v7 (whole-conversation summary)</td><td>low</td><td><strong>41 / 43</strong></td><td>4.1 s</td></tr>
        </tbody>
      </table>
      <p>The biggest gain didn't come from the prompt. It came from <strong>turning thinking down</strong>: with default reasoning the model ran for 43 seconds and timed out, and with <code>low</code> it was both faster and more accurate. The two remaining misses are written down (a certificate warning flagged as needing a reply, and a banner request rated Medium), not hidden.</p>
      <blockquote><p>[!warning] Treat the model as untrusted input</p><p>The AI only classifies and drafts. It can't send, close or reassign anything, and instructions inside an email are treated as text. Even a perfect score wouldn't change that.</p></blockquote>

      <h2>7. What Two Days Produced</h2>
      <ul>
        <li><strong>Foundation:</strong> .NET 10 minimal APIs, EF Core 10 on PostgreSQL 18, Redis 8, Angular 22 staff app and client portal, everything in Docker Compose with live reload.</li>
        <li><strong>Sign-in:</strong> Microsoft OIDC with an MFA check, our ERP's sign-in finished with a passkey, passkey sign-in, Redis sessions, CSRF protection.</li>
        <li><strong>Access:</strong> nine built-in roles, a permission matrix with system/client/project scope, and a deny-by-default client filter on every client-owned table.</li>
        <li><strong>Mail:</strong> Microsoft Graph delta sync, client identification, one conversation across several people's inboxes.</li>
        <li><strong>Work:</strong> AI classification and a whole-conversation summary rewritten on each message, work items with business-calendar deadlines, routing, snooze, reassign, in-app notifications, and an audit log page.</li>
      </ul>
      <p>That's not the product. Drafting and approval, Teams and SMS escalation, the client portal and the security hardening are later phases. But the foundation is the part that usually takes weeks, and it's the part every later feature depends on being right.</p>

      <h2>8. Takeaways</h2>
      <ul>
        <li><strong>Write the spec first.</strong> Numbered requirements and acceptance tests give agents something to build against and reviewers something to check.</li>
        <li><strong>One rule book</strong> (<code>AGENTS.md</code>) that every tool points at, and <strong>one team file</strong> for ownership and review pairs.</li>
        <li><strong>Pick agents by strength</strong>, give each one its own folders and worktree, and run them in restricted modes.</li>
        <li>The lead's job is <strong>review, integration and proof</strong>: rule scans, zero-warning builds, real-database tests, screenshots.</li>
        <li>Keep a <strong>handover file</strong> so any agent or person can take over mid-flight.</li>
        <li><strong>Measure the AI</strong> with an eval set before and after every prompt or model change.</li>
      </ul>
      <p>The same idea at a smaller scale is in <a href="/blog/migrating-worker-services-to-dotnet-10-with-skills-and-coding-agents">migrating worker services to .NET 10 with skill files</a>, and the habits behind both are in <a href="/blog/ai-development-workflow-obsidian-mcp-skills">how I use an Obsidian vault, MCP and Skills</a>.</p>
    `,
  },
  {
    slug: "migrating-worker-services-to-dotnet-10-with-skills-and-coding-agents",
    title: "Two Days, Not Two Sprints: Migrating Worker Services to .NET 10 with Skill Files and Coding Agents",
    excerpt: "We moved legacy .NET Core 3.1 background services to cross-platform .NET 10 worker services in two days. The agent did the typing; two skill files, our API house style and a worker migration playbook, told it what done looks like.",
    date: "November 14, 2026",
    category: "Artificial Intelligence",
    tags: [".NET Core", "Background Services", "Skills", "Claude Code", "Migration"],
    content: `
      <p class="lead">We had a set of background worker services still on .NET Core 3.1: Windows-only, tied to hard-coded drive paths, writing a log line to disk on every step, and guarding against overlapping runs with a plain <code>bool</code>. Migrating them by hand usually costs a sprint per service, because every one carries years of local decisions. We moved them to <strong>.NET 10 worker services</strong> in <strong>two days</strong>. The speed didn't come from the agent typing faster. It came from two <strong>skill files</strong> that told the agent exactly what "done" looks like in our codebase.</p>

      <h2>1. Why Agents Alone Weren't Enough</h2>
      <p>Ask a coding agent to "upgrade this worker to .NET 10" and you get a working tutorial: a fresh <code>BackgroundService</code>, a generic logger, maybe EF Core. It compiles, and it looks nothing like the other forty projects in the solution. Reviewing that output and pulling it back to house style takes longer than doing the migration yourself.</p>
      <p>A migration at this scale needs three things the model doesn't have:</p>
      <ul>
        <li><strong>The target shape:</strong> how our layers, logging, configuration and stored procedures are meant to look.</li>
        <li><strong>The migration traps:</strong> what breaks when 3.1 code meets .NET 10 and Linux.</li>
        <li><strong>A definition of done:</strong> a checklist the agent verifies before it says it's finished.</li>
      </ul>
      <p>A skill is how you hand an agent all three, once, instead of re-typing them in every prompt.</p>

      <h2>2. Two Skills, Stacked</h2>
      <pre>
API endpoint skill  (house style)
  layering: Controller → BAL → DAL → DTOs
  logging:  buffered step logger
  data:     Dapper + stored procedures, SQL rules
  headers, naming, DTO and DAL return rules
        │  reused by
        ▼
Worker service skill  (migration playbook)
  netcoreapp3.1 → net10.0, multi-RID
  Worker → Service/BAL → DAL → DTOs
  PeriodicTimer + reentrancy guard
  CodeLog bridge, cross-platform paths
  Windows Service · systemd · Docker
        │
        ▼
Coding agent: orient → convert → build → checklist → PR</pre>
      <p>The <strong>API endpoint skill</strong> came first. It encodes our house style for every .NET Web API: one controller per action, a business layer (BAL) that validates and builds the response, a thin data layer (DAL) over Dapper and stored procedures, defaulted DTOs, a shared response envelope, and the auth and exception filters that already exist. It also carries our SQL standards, from <code>usp&lt;Action&gt;&lt;Entity&gt;</code> naming to <code>SET NOCOUNT ON</code>, no <code>SELECT *</code>, and default values on any new parameter so existing callers don't break.</p>
      <p>The <strong>worker service skill</strong> is built on top of it. A worker is the same layered code with a timer instead of an HTTP request, so it reuses the BAL/DAL rules, naming and comment headers, and adds what's specific to background services and to the migration itself.</p>
      <blockquote><p>[!tip] Distil skills from real code</p><p>Both skills were written from reference implementations already in production, not from documentation. The skill says "this is how our best existing service does it", and that's what the agent copies.</p></blockquote>

      <h2>3. Step Zero: Orient Before Editing</h2>
      <p>The most useful section of both skills is the first one. Before touching a file, the agent has to answer a fixed set of questions about the project in front of it:</p>
      <ul>
        <li>Does the service reference shared library projects, or carry its own copies of BAL/DAL folders? Shared libraries need to multi-target <code>netcoreapp3.1;net10.0</code> while other services still depend on them.</li>
        <li>Which packages does it use? <code>System.Data.SqlClient</code> must become <code>Microsoft.Data.SqlClient</code>, and <code>Microsoft.Extensions.*</code> moves to 10.x.</li>
        <li>Does anything use <code>System.Drawing.Common</code>? Since .NET 7 it's Windows-only, so image or spreadsheet rendering has to move to a non-GDI library or sit behind an OS check.</li>
        <li>Where are the hard-coded Windows paths, the schedule interval, and the multi-site loop?</li>
      </ul>
      <p>This stops the agent assuming every service is a copy of the reference one. It also means the agent opens each pull request with a short inventory, so reviewing it starts with what the agent found rather than with a diff.</p>

      <h2>4. What the Worker Skill Changes</h2>
      <h3>One project file for every platform</h3>
      <p>Each service now targets <code>net10.0</code> with the worker SDK and declares the runtimes it can be published for:</p>
      <pre class="language-xml">
&lt;Project Sdk="Microsoft.NET.Sdk.Worker"&gt;
  &lt;PropertyGroup&gt;
    &lt;TargetFramework&gt;net10.0&lt;/TargetFramework&gt;
    &lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;
    &lt;RuntimeIdentifiers&gt;win-x64;win-x86;win-arm64;linux-x64;linux-arm64;linux-arm&lt;/RuntimeIdentifiers&gt;
  &lt;/PropertyGroup&gt;
  &lt;ItemGroup&gt;
    &lt;PackageReference Include="Microsoft.Extensions.Hosting.WindowsServices" Version="10.0.0" /&gt;
    &lt;PackageReference Include="Microsoft.Extensions.Hosting.Systemd" Version="10.0.0" /&gt;
    &lt;PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.2" /&gt;
    &lt;PackageReference Include="Dapper" Version="2.1.35" /&gt;
  &lt;/ItemGroup&gt;
&lt;/Project&gt;</pre>

      <h3>A host that knows where it's running</h3>
      <p><code>Program.cs</code> moves to <code>Host.CreateApplicationBuilder</code> and picks the right service integration at startup, so the same build runs as a Windows Service or a systemd daemon:</p>
      <pre class="language-csharp">
var builder = Host.CreateApplicationBuilder(args);

if (OperatingSystem.IsWindows())
{
    builder.Services.AddWindowsService(o =&gt; o.ServiceName = "BulkInvoiceWorkerService");
}
else if (OperatingSystem.IsLinux())
{
    builder.Services.AddSystemd();
}

builder.Services.Configure&lt;WorkerSettings&gt;(builder.Configuration.GetSection("AppSettings"));
builder.Services.AddScoped&lt;ICodeLogger, BufferedCodeLogger&gt;();
builder.Services.AddScoped&lt;BulkInvoiceService&gt;();
builder.Services.AddHostedService&lt;Worker&gt;();

var host = builder.Build();
host.Services.GetRequiredService&lt;ILogger&lt;Program&gt;&gt;().LogInformation(
    "Starting on {OS} [{Arch}], .NET {Runtime}",
    RuntimeInformation.OSDescription, RuntimeInformation.ProcessArchitecture, Environment.Version);
await host.RunAsync();</pre>
      <p>That startup line seems minor until a service is quietly running as x86 on a 64-bit box. It answers "what is this actually running on?" from the first log line.</p>

      <h3>PeriodicTimer and a real reentrancy guard</h3>
      <p>The legacy workers used a timer callback plus a <code>bool IsInProcess</code> flag to skip a tick while the previous run was still going. That flag isn't thread-safe. The new <code>Worker</code> uses <code>PeriodicTimer</code>, a <code>SemaphoreSlim</code> and a fresh DI scope per tick:</p>
      <pre class="language-csharp">
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(_options.ScheduleTimer));

    await DoWorkSafelyAsync(stoppingToken);              // run once at start
    while (await timer.WaitForNextTickAsync(stoppingToken))
    {
        await DoWorkSafelyAsync(stoppingToken);
    }
}

private async Task DoWorkSafelyAsync(CancellationToken token)
{
    if (!await _executionLock.WaitAsync(0, token))       // previous run still going
    {
        _logger.LogWarning("Previous run still in progress, skipping this tick.");
        return;
    }
    try
    {
        using var scope = _scopeFactory.CreateScope();     // fresh logger + services per tick
        var service = scope.ServiceProvider.GetRequiredService&lt;BulkInvoiceService&gt;();
        var codeLog = scope.ServiceProvider.GetRequiredService&lt;ICodeLogger&gt;();
        await service.ProcessServiceAsync(codeLog, token);
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        _logger.LogError(ex, "Cycle failed");
    }
    finally
    {
        _executionLock.Release();
    }
}</pre>
      <p>Stopping the service now cancels the wait instead of waiting for the next tick, and a slow run can never overlap the next one.</p>

      <h3>One site failing doesn't stop the others</h3>
      <p>Most of these workers loop over many client sites, each with its own database. The skill requires every site to run inside its own <code>try/catch</code>, with its own decrypted connection string, so one site's bad data logs an error and the loop moves on to the next.</p>

      <h2>5. The Logging Trick: Bridge, Don't Rewrite</h2>
      <p>Every legacy service had dozens of calls like <code>CreateCodeLogProgramWise(message, method, siteCode)</code>, and each one wrote a line to disk synchronously. In a loop over many sites every few seconds, that's a lot of disk I/O for logs nobody reads unless something fails.</p>
      <p>Rewriting every call site would have been the slow, risky part of the migration. Instead, the skill tells the agent to change only the method body and route it to the <strong>buffered step logger</strong> our APIs already use:</p>
      <pre class="language-csharp">
public void CreateCodeLogProgramWise(string message, string methodName, string siteCode)
{
    // In memory: no disk write on the happy path
    _codeLog?.Code(methodName, $"[{siteCode}] {message}");

    // Old disk logging only if no buffered logger was injected
    if (_options.CodeLogRequired == 1 &amp;&amp; _codeLog == null)
    {
        LegacyFileLog.Write(message, methodName, siteCode);
    }
}</pre>
      <p>The buffered logger keeps up to 100 steps per tick in memory. On success they're discarded. When something throws, <code>codeLog.Error(...)</code> writes the whole chain of steps that led to the failure, in order. The happy path stops writing to disk, and a failure gets a more complete log than before. None of the existing callers changed.</p>
      <blockquote><p>[!note] This is where stacking skills pays off</p><p>The buffered logger is defined in the API skill. Because the worker skill reuses it, the agent didn't invent a third logging approach. API and worker logs now read the same way.</p></blockquote>

      <h2>6. Cross-Platform Paths and Deployment</h2>
      <p>Configuration files were full of paths like <code>D:\\Live\\...\\Errorlog\\</code>. On Linux those don't fail loudly: they create a folder literally named <code>D:\\Live\\...</code> next to the binary. The skill's rule is simple: no drive letters or backslashes in code, build paths with <code>Path.Combine</code> from <code>AppContext.BaseDirectory</code>, and override per environment:</p>
      <pre>
AppSettings__ErrorLogFilePath=/var/log/workers/bulk-invoice/</pre>
      <p>The skill also includes the deployment recipes, so the agent finishes each service with all three ready:</p>
      <ul>
        <li><strong>Windows Service</strong> via <code>sc.exe create</code>, as before.</li>
        <li><strong>systemd unit</strong> with <code>Type=notify</code> and <code>Restart=always</code>, which works because of <code>AddSystemd()</code>.</li>
        <li><strong>Multi-arch Dockerfile</strong> using <code>--platform=$BUILDPLATFORM</code> and <code>TARGETARCH</code>, so one build produces AMD64 and ARM64 images.</li>
      </ul>
      <pre>
dotnet publish -c Release -r linux-arm64 --self-contained true -p:PublishSingleFile=true -o ./publish/linux-arm64</pre>

      <h2>7. The Checklist Is the Definition of Done</h2>
      <p>Both skills end with a checklist, and the agent is told to go through it before calling a service finished. A few of the worker items:</p>
      <ul>
        <li>Targets <code>net10.0</code>, declares runtime identifiers, and no <code>System.Data.SqlClient</code> is left.</li>
        <li>The host uses <code>AddWindowsService</code> / <code>AddSystemd</code> and logs OS, architecture and runtime at startup.</li>
        <li>No hard-coded Windows paths remain.</li>
        <li><code>PeriodicTimer</code> plus <code>SemaphoreSlim</code>, with no unsynchronised <code>IsInProcess</code> flag.</li>
        <li>Every site has its own error boundary, and DAL methods return empty lists, never <code>null</code>.</li>
        <li>Stored procedures follow the API skill's SQL rules.</li>
        <li>Publishes for <code>win-x64</code>, <code>win-x86</code>, <code>linux-x64</code> and <code>linux-arm64</code>.</li>
      </ul>
      <p>The checklist is what made review fast. Instead of reading every diff from scratch, a reviewer confirms the agent's checklist against the code and spends their attention on the business logic, which is the part only a person who knows the system can judge.</p>

      <h2>8. The Loop We Ran</h2>
      <ol>
        <li><strong>Write the skills from the best existing code.</strong> The API skill already existed. The worker skill was distilled from the reference worker services.</li>
        <li><strong>Migrate one service with the agent and watch closely.</strong> Every place the agent guessed became a new rule in the skill.</li>
        <li><strong>Run the agent across the remaining services</strong>, one branch each: orient, convert, build, publish for each runtime, run the checklist.</li>
        <li><strong>Review against the checklist</strong>, then run each service side by side with the old one before switching over.</li>
        <li><strong>Feed corrections back into the skill</strong>, so the next service needs fewer of them.</li>
      </ol>
      <blockquote><p>[!warning] Fast doesn't mean unreviewed</p><p>The agent did the repetitive work: project files, hosting, timers, logging bridges, paths and deployment files. People still reviewed every pull request and checked each service against the one it replaced. Two days was possible because the review was focused, not because there wasn't one.</p></blockquote>

      <h2>9. Takeaways</h2>
      <ul>
        <li>Agents are fast but generic. A <strong>skill</strong> turns "upgrade to .NET 10" into "upgrade to <em>our</em> .NET 10".</li>
        <li><strong>Stack skills.</strong> A migration skill that reuses your house-style skill keeps APIs and workers consistent.</li>
        <li>Make <strong>orientation</strong> the first step, so the agent inventories each project before changing it.</li>
        <li><strong>Bridge legacy call sites</strong> instead of rewriting them. One method body change beat hundreds of edits.</li>
        <li>End every skill with a <strong>checklist</strong>. It's the agent's definition of done and the reviewer's map.</li>
        <li>Every correction belongs in the skill, not in the next prompt.</li>
      </ul>
      <p>For the wider workflow these skills belong to, see <a href="/blog/ai-development-workflow-obsidian-mcp-skills">how I use an Obsidian vault, MCP and Skills</a>, and for the worker basics, the <a href="/blog/dotnet-dynamic-background-service-manager">dynamic background service manager in .NET 8</a>.</p>
    `,
  },
  {
    slug: "rtx-5090-vs-dgx-spark-local-llm-inference",
    title: "RTX 5090 vs DGX Spark for a Local AI Agent: Why Memory Bandwidth Won",
    excerpt: "Same model, same Ollama version, same request: the RTX 5090 answered in ~15 seconds and the DGX Spark in ~41. Here is why bandwidth, not memory size, decided it, and when the Spark is still the right box.",
    date: "October 18, 2026",
    category: "Artificial Intelligence",
    tags: ["LLMs", "GPUs", "Ollama", "Performance", "Self-hosted AI"],
    content: `
      <p class="lead">We had an NVIDIA DGX Spark to evaluate for our self-hosted AI agent, and an RTX 5090 workstation already running it. On paper the Spark looks like the bigger machine: four times the memory. In practice, for the model we actually run, the RTX 5090 answered the same question in roughly a third of the time.</p>

      <h2>1. A Fair Test</h2>
      <p>The DGX Spark ships without models preloaded, so both machines were set up the same way:</p>
      <ul>
        <li><strong>Model:</strong> Gemma 4 26B on both.</li>
        <li><strong>Runtime:</strong> Ollama 0.31.1 on both.</li>
        <li><strong>Workload:</strong> the same agent request (prompt, conversation history and tool definitions), measured end to end.</li>
      </ul>

      <h2>2. Results</h2>
      <table>
        <thead><tr><th>Metric</th><th>RTX 5090</th><th>DGX Spark</th></tr></thead>
        <tbody>
          <tr><td>Response time (same request)</td><td>~15 s</td><td>~41 s</td></tr>
          <tr><td>Relative response time</td><td>1×</td><td>2.73× slower</td></tr>
          <tr><td>Extra waiting time</td><td>—</td><td>~26 s</td></tr>
        </tbody>
      </table>
      <blockquote><p>[!success] The RTX 5090 finished in about 63% less time</p><p>For this workload the DGX Spark brought no speed-up over the workstation.</p></blockquote>

      <h2>3. Why: Bandwidth Beats Capacity When the Model Fits</h2>
      <table>
        <thead><tr><th>Hardware</th><th>RTX 5090</th><th>DGX Spark (GB10)</th></tr></thead>
        <tbody>
          <tr><td>Memory</td><td>32 GB GDDR7</td><td>128 GB unified LPDDR5x</td></tr>
          <tr><td>Memory bus</td><td>512-bit</td><td>256-bit</td></tr>
          <tr><td>Data rate per pin</td><td>28 Gbps</td><td>~8.533 Gbps</td></tr>
          <tr><td>Memory bandwidth</td><td>1,792 GB/s</td><td>~273 GB/s</td></tr>
          <tr><td>Capacity</td><td>1×</td><td>4×</td></tr>
          <tr><td>Bandwidth</td><td>~6.6×</td><td>1×</td></tr>
        </tbody>
      </table>
      <p>An answer comes in two phases. <strong>Prefill</strong> reads the prompt, the conversation history and every tool definition. <strong>Generation</strong> then produces the answer one token at a time, and every token means streaming the model's weights through memory again. That second phase is limited by memory bandwidth far more than by compute.</p>
      <p>Gemma 4 26B fits comfortably in the RTX 5090's 32 GB, so the Spark's extra capacity buys nothing here, while the 5090 moves data about 6.6 times faster. That bandwidth gap is the most likely reason for the result.</p>
      <blockquote><p>[!note] What we did not measure</p><p>We timed the whole response, not prefill and generation separately, and this was one request per machine. The direction of the result is clear; the exact ratio will move with prompt length, output length and quantization.</p></blockquote>

      <h2>4. When the DGX Spark Is the Right Box</h2>
      <p>128 GB of unified memory is a real advantage when the workload does not fit in 32 GB:</p>
      <ul>
        <li>Larger models that would not load on a single consumer GPU at all.</li>
        <li>Much longer context windows, where the KV cache grows with every token of history.</li>
        <li>Several models resident at once (for example an embedding model, a reranker and a chat model).</li>
      </ul>
      <p>Choose for the model you will actually run: if it fits in GPU memory, bandwidth decides speed; if it does not, capacity decides whether it runs at all.</p>

      <h2>5. What We Test Next</h2>
      <ul>
        <li>NVIDIA-native models from NVIDIA's model registry, which may be better optimised for the Spark's hardware.</li>
        <li>Separate timings for prefill and generation, so each machine's strength is visible on its own.</li>
        <li>A change to how the model runs on the server that could make answers roughly twice as fast at the same quality, tested on our own hardware before it goes anywhere else.</li>
      </ul>

      <h2>6. Takeaways</h2>
      <ul>
        <li>For local LLM inference, check memory bandwidth before memory size.</li>
        <li>More memory only helps once the model, or its context, no longer fits.</li>
        <li>Benchmark with your own model, runtime version and real requests; spec sheets don't tell you the answer for your workload.</li>
      </ul>
    `
  },
  {
    slug: "ai-development-workflow-obsidian-mcp-skills",
    title: "Memory, Reach and Habits: How I Use an Obsidian Vault, MCP and Skills to Ship Production-Grade Code",
    excerpt: "AI assistants write code quickly but know nothing about my systems. My workflow gives them three things: an Obsidian vault as memory, MCP servers as reach, and Skills as habits. Then nothing ships until it's measured.",
    date: "September 26, 2026",
    category: "Artificial Intelligence",
    tags: ["MCP", "Obsidian", "Claude Code", "Skills", "Performance"],
    content: `
      <p class="lead">An AI assistant can write a controller in seconds. What it can't do on its own is know why we chose one database per tenant, how a failed deploy was fixed last month, or what every API response in our house style looks like. Most "the AI wrote bad code" moments are really missing context. My workflow is built around closing that gap: an <strong>Obsidian vault</strong> as the assistant's memory, <strong>MCP servers</strong> as its reach into my systems, and <strong>Skills</strong> as its habits. Then one rule on top: nothing ships until it has been measured.</p>

      <h2>1. The Problem: Speed Without Context</h2>
      <p>Assistants are fast and fluent, and that makes their gaps easy to miss. Left alone, they invent conventions, forget decisions made three weeks ago and declare a fix done because it compiles. Production-grade work needs three things a model doesn't bring with it:</p>
      <ul>
        <li><strong>Context:</strong> the decisions, trade-offs and incidents behind the code.</li>
        <li><strong>Conventions:</strong> how things are done here, applied every time rather than when remembered.</li>
        <li><strong>Proof:</strong> evidence that a change works, from a build, a test or a measurement.</li>
      </ul>

      <h2>2. The Stack at a Glance</h2>
      <pre>
Obsidian vault ─▶ Obsidian MCP server ──┐
 (ADRs, runbooks,                        │
  project notes, prompts)                │
                                         ├──▶ Claude · Claude Code · Antigravity
Code + SQL Server ─▶ code-intel MCP ─────┤            │
                                         │            ▼
Skills (house style, doc formats) ───────┘   branch ─▶ build ─▶ test ─▶ measure ─▶ PR
                                                                             │
                                  vault updated (ADR, runbook) ◀── merge ◀───┘</pre>

      <h2>3. The Vault: Memory</h2>
      <p>My Obsidian vault is where decisions live. It has four kinds of notes, and each one answers a different question an assistant would otherwise guess at:</p>
      <ul>
        <li><strong>Architecture notes and ADRs</strong> answer <em>why is it built like this?</em> One note per decision: the context, the options, what we chose and what it costs.</li>
        <li><strong>Runbooks and incidents</strong> answer <em>what went wrong before?</em> Deploy steps, production fixes and post-mortems.</li>
        <li><strong>Project and R&amp;D notes</strong> answer <em>what exists and how does it connect?</em> One note per project or experiment, linked by the technologies they share.</li>
        <li><strong>Prompts and AI context</strong> answer <em>how should the assistant work here?</em> Reusable prompts, conventions and the context I hand to every session.</li>
      </ul>
      <p>Short, consistently shaped notes matter more than long ones. A decision note in this shape is easy for a person to skim and easy for a model to use:</p>
      <pre class="language-markdown">
# ADR: One database per workspace
Status: accepted
Context: tenants must never see each other's data; removing a tenant must be trivial
Decision: each workspace gets its own database, named after the workspace
Consequences: + isolation by construction, + delete = drop database
              - one provisioning step per new workspace
Links: [[MongoDB]] [[Multi-tenancy]] [[MCP server for code intelligence]]</pre>
      <blockquote><p>[!tip] Link notes by technology</p><p>Links are what turn a folder of notes into a map. The <a href="/graph">knowledge graph</a> on this site is modelled on the vault's graph view: projects, experiments and posts connected through the technologies they share.</p></blockquote>

      <h2>4. MCP: Reach</h2>
      <p>The Model Context Protocol is how the assistant reaches that memory and my systems without me pasting anything. Three servers do most of the work:</p>
      <ul>
        <li><strong>Obsidian MCP server:</strong> the assistant searches and reads the vault directly. "Check the ADRs before changing tenant storage" becomes something it can actually do.</li>
        <li><strong>Code-intelligence MCP server:</strong> the server I built that maps C# solutions with Roslyn and SQL Server schemas through catalogue views, exposed as 40+ tools. It answers "who calls this stored procedure?" from facts instead of guesses. The <a href="/blog/mcp-server-code-database-intelligence">full write-up is here</a>.</li>
        <li><strong>This portfolio's own MCP endpoint:</strong> the same idea pointed outwards. Any MCP client can <a href="/ai">query my projects and posts</a>.</li>
      </ul>
      <blockquote><p>[!warning] Reach is not permission</p><p>An MCP server can read far more than a task needs. Scope each one to what it serves, keep secrets out of notes, and treat anything an assistant reads from outside as data, not instructions.</p></blockquote>

      <h2>5. Skills: Habits</h2>
      <p>A convention that lives only in a senior developer's head gets applied when someone remembers it. A Skill packages it so the assistant applies it every time it's relevant.</p>
      <ul>
        <li><strong>My .NET API skill</strong> encodes our house style for Web APIs: Controller, business layer, data layer and DTOs; convention-based dependency injection; structured logging; global exception handling; JWT authentication; and one uniform response envelope. "Add an endpoint" now produces code that matches the rest of the codebase instead of a generic tutorial.</li>
        <li><strong>Document skills</strong> for PDF, Word, Excel and PowerPoint handle the non-code side: specs, reports and client documents, in formats people actually open.</li>
      </ul>
      <blockquote><p>[!note] Next skills</p><p>The vault already holds the raw material for more: runbooks that can become deployment checklists, and incident notes that can become a review checklist for the mistakes we have already made once.</p></blockquote>

      <h2>6. The Tools</h2>
      <ul>
        <li><strong>Claude</strong>, with MCP servers and Skills attached, for design, research and writing: reading the vault, querying the code map, drafting ADRs.</li>
        <li><strong>Claude Code</strong> for changes to a repository: it works on a branch, runs the build, the type checker and the tests, and opens a pull request.</li>
        <li><strong>Antigravity</strong> for agent-driven work inside the editor.</li>
      </ul>
      <p>The tools matter less than what they are connected to. The same model is a different assistant with the vault, the code map and the house style behind it.</p>

      <h2>7. Production-Grade Means Measured</h2>
      <p>A case study from this site. PageSpeed Insights scored the pages poorly on mobile. The workflow was: measure, find the cause, change one thing, measure again, and compare against <code>main</code>.</p>
      <ul>
        <li><strong>Measure:</strong> Lighthouse with mobile settings showed about <strong>25 seconds of Total Blocking Time</strong> on every page.</li>
        <li><strong>Find the cause:</strong> a WebGL fluid background redrew every frame from page load. With it switched off, the home page went from 48 to 83.</li>
        <li><strong>Fix, then re-measure:</strong> start the effect on the first interaction, paint content without waiting for JavaScript, self-host fonts and remove a 100 KB inlined image. Blocking time dropped to a few hundred milliseconds across the site.</li>
        <li><strong>Check the claim:</strong> Lighthouse varies by about five points run to run, so every later feature was compared against <code>main</code> in alternating runs, and browser tests confirmed it behaved the same afterwards.</li>
      </ul>
      <blockquote><p>[!danger] The first fix isn't always a fix</p><p>One "optimisation", putting an animated element on its own compositor layer, made the score worse on a phone without a GPU. Only a measurement caught it, and it was reverted. An assistant that says "this should be faster" has made a prediction, not a result.</p></blockquote>

      <h2>8. The Loop</h2>
      <ol>
        <li>Write down the decision or the problem in the vault.</li>
        <li>The assistant reads the relevant notes through MCP, and the code map for the parts of the system involved.</li>
        <li>Skills shape the change so it matches the house style.</li>
        <li>The agent implements it on a branch and proves it: types, build, tests, and a measurement where performance is involved.</li>
        <li>Review and merge the pull request.</li>
        <li>Update the vault: a new ADR, a runbook step, or an incident note. The next session starts with more context than this one did.</li>
      </ol>

      <h2>9. Takeaways</h2>
      <ul>
        <li>Most bad AI output is missing context. Give the assistant <strong>memory</strong> (a vault), <strong>reach</strong> (MCP) and <strong>habits</strong> (Skills).</li>
        <li>Keep notes short, consistently shaped and linked. Structure is what makes them usable by a model.</li>
        <li>Encode conventions once as a Skill instead of repeating them in every prompt.</li>
        <li>Production-grade means measured: build, test, and compare against a baseline before claiming anything.</li>
        <li>Close the loop. Every merged change should leave the vault a little smarter.</li>
      </ul>
    `
  },
  {
    slug: "mcp-server-code-database-intelligence",
    title: "Giving AI Assistants a Map of Your Codebase: An MCP Server for C# Code and SQL Server Schemas",
    excerpt: "How I built a Model Context Protocol server that analyses C# solutions with Roslyn and SQL Server schemas through catalogue views, stores a structured map in MongoDB per workspace, and exposes it to AI assistants as 40+ tools.",
    date: "September 23, 2026",
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
      <blockquote><p>[!tip] Three small decisions keep this robust</p><p>The temp directory has a GUID in its name, so overlapping runs can never collide. Cleanup sits in <code>finally</code>, so a failed run leaves nothing behind. And a missing branch returns "skip this repository" instead of an exception, so one misconfigured repo doesn't cancel the whole sync.</p></blockquote>

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
      <blockquote><p>[!tip] Three details make it work</p>
      <ul>
        <li><strong>Cancellation instead of flags.</strong> The loop checks <code>_cts.Token.IsCancellationRequested</code>, and the same token is passed to <code>Task.Delay</code>, so <code>Stop()</code> also interrupts a worker that is in the middle of waiting.</li>
        <li><strong>Config is read on every pass.</strong> <code>UpdateConfig</code> just replaces <code>_config</code>. The loop reads <code>_config</code> each time round, so the next pass picks up the new value and interval.</li>
        <li><strong>Async, not threads.</strong> While a worker waits it holds no thread, so hundreds of workers cost almost nothing when idle.</li>
      </ul></blockquote>

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
      <blockquote><p>[!success] This blog post is the test</p><p>I committed it to the portfolio repo, pushed to <code>main</code>, and GitHub's webhook told Coolify to rebuild. With a health check on <code>/</code>, the old container keeps serving until the new one is healthy, so the deploy has no downtime. Grafana and n8n run alongside it as one-click services on their own subdomains.</p></blockquote>

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
      <blockquote><p>[!question] When to move to K3s</p><p>At 20+ services, when you need CPU/memory-based autoscaling (Swarm can't do this natively), or when you need fine-grained scheduling, secrets or network policies.</p></blockquote>

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
      <blockquote><p>[!danger] Deletes surfaced a real bug</p><p>A missing page threw a raw error, and Next.js turned that into a <strong>500</strong>. The fix is to treat an API 404 as "not found", return <code>null</code> and call <code>notFound()</code>. An API that's actually broken should still throw and surface as a 500.</p></blockquote>

      <h2>4. Trap #1: Dev Mode Lies About Caching</h2>
      <p><code>next dev</code> doesn't honour the fetch cache the way production does. I disabled the webhook entirely, edited content in .NET, and the dev server still showed the change instantly. That makes it look as if revalidation isn't needed. Only <code>next build &amp;&amp; next start</code> shows real caching.</p>
      <blockquote><p>[!warning] Always validate this pattern against a production build.</p></blockquote>

      <h2>5. Trap #2: Next.js 16 Changed <code>revalidateTag</code></h2>
      <p>The single-argument <code>revalidateTag(tag)</code> from most tutorials is deprecated in Next.js 16. It now takes a second argument:</p>
      <pre class="language-typescript">
// expire immediately: what a synchronous "content saved" webhook wants
revalidateTag('page-home', { expire: 0 });

// stale-while-revalidate semantics
revalidateTag('page-home', 'max');</pre>
      <blockquote><p>[!tip] Check the bundled docs</p><p><code>create-next-app@latest</code> installed a version far newer than the tutorials assume. When an API behaves oddly, check the docs bundled in <code>node_modules/next/dist/docs/</code> before trusting remembered examples.</p></blockquote>

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
    category: "Search & Vectors",
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
        <li><strong>Typos:</strong> "Chrons" resolves via Solr's native fuzzy operator. A curated stop-word list (~60 words) stops common English words from being offered as fuzzy matches.</li>
        <li><strong>Synonyms live in Solr</strong>, not in C# dictionaries. Gender and size moved to <code>*_text</code> fields backed by <code>synonyms.txt</code>.</li>
        <li><strong>Prices:</strong> "under X", "between X and Y", reversed phrasing, "~X" (±10%), "12,000" and "12k".</li>
      </ul>

      <h2>5. Multi-Intent Queries</h2>
      <p>"red card case and gold tone watch under 5000" is two searches. Splitting on commas and a standalone "and" (while protecting "between X and Y" and "12,000") lets each clause run the <em>entire</em> pipeline with its own price and filters. Otherwise the watch clause's category filter would starve the card-case clause.</p>
      <blockquote><p>[!example] The reverse case matters too</p><p>In "black and blue watches", "black" is only a modifier. Clauses that contain nothing but a colour, brand or gender word get merged into their neighbour, so they don't trigger a catalog-wide search for "black".</p></blockquote>

      <h2>6. The Details That Make It Feel Right</h2>
      <ul>
        <li><strong>Style-level de-dup:</strong> the same style in three colours shows once, with its colour swatches harvested through Solr collapse + expand.</li>
        <li><strong>Phrase proximity</strong> (<code>pf2</code>) reranks adjacent-word matches above bag-of-words hits.</li>
        <li><strong>Business signals</strong> (rating, sale count, availability) as an edismax boost function that nudges relevance but doesn't override it.</li>
        <li><strong>Embedded SKUs</strong> ("watch CR6121") are forced to position one.</li>
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
      <blockquote><p>[!note] Plan</p><p>A single generation prompt with the relevant schema inlined, which analyses, generates and validates in one pass. It's the simplest architecture, the easiest to debug, and worth an estimated 8-12 seconds. The risk is SQL accuracy, so it ships behind a feature flag and gets A/B tested on 20+ reference questions.</p></blockquote>

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
      <blockquote><p>[!success] p99 latency: 180 ms → 42 ms</p><p>After deploying these optimizations, load tests run via k6 showed a drop in p99 latency from 180ms to 42ms. Heap allocations per request dropped from 14KB to under 200 bytes. This not only improved user experience but also slashed our container resource requirements by half.</p></blockquote>
    `
  },
  {
    slug: "load-testing-microservices-k6-grafana",
    title: "Designing Repeatable Load Testing Suites with k6 and Grafana",
    excerpt: "A guide to building a continuous load testing pipeline to detect latency regressions before code reaches staging.",
    date: "April 15, 2026",
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
      <blockquote><p>[!tip] An automated quality gate</p><p>Using k6's <code>thresholds</code> feature, we can configure our CI/CD pipelines to fail the build automatically if p99 latency exceeds 200ms or if the error rate climbs above 1% during tests. This acts as an automated quality gate.</p></blockquote>
    `
  },
  {
    slug: "building-rag-pipeline-internal-documentation",
    title: "Building an Advanced RAG Pipeline for Developer Knowledge Discovery",
    excerpt: "How we leveraged LangChain and vector databases to build a context-aware search engine for internal APIs.",
    date: "March 10, 2026",
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
      <blockquote><p>[!tip] Search small chunks, return the parent document</p><p>One of the largest hurdles was preventing LLM hallucinations. We solved this by implementing parent-document retrieval. We store small chunks (100 tokens) for search, but return the parent document (500 tokens) to the LLM to preserve surrounding context. This improved accuracy by 35%.</p></blockquote>

      <h2>3. Results</h2>
      <p>The developer assistant now answers natural language questions like 'How do I initialize the auth client?' within 3 seconds, citing exact source links. This has dramatically improved onboarding speed for new developers.</p>
    `
  }
];

export const blogs: BlogPost[] = posts.map((post) => ({ ...post, readTime: readTime(post.content) }));
