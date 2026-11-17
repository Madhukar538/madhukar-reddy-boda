/**
 * The exhibit beside each chapter of the Editorial journey (editorial-story.tsx): a small piece of
 * evidence that animates in when the chapter arrives (the reveal sets data-in; globals.css runs the
 * animation from it). Without the script, or with reduced motion, each shows its finished state.
 * Every figure is from the experience data or the linked posts.
 */

export type ExhibitKind = 'degree' | 'brands' | 'latency' | 'rnd' | 'ai' | 'agents';

const BRANDS = ['Jockey', 'Speedo', 'Manyavar', 'LuxCozi', 'Fossil India'];
const RND = ['legacy → .NET', 'webrtc-video/', 'iot-mqtt/', 'offline-first-pwa/', 'incident-platform/'];

function Degree() {
  return (
    <div className="ex-ticket">
      <p className="ex-kicker">Admit one · Prologue</p>
      <p className="ex-big">B.Sc</p>
      <p>Computer Science</p>
      <p className="ex-mono">Satavahana University · Karimnagar</p>
      <span className="ex-stamp">00</span>
    </div>
  );
}

function Brands() {
  return (
    <div className="ex-brands">
      <p className="ex-kicker">Shipped for</p>
      <ul>
        {BRANDS.map((b, i) => (
          <li key={b} style={{ '--n': i } as React.CSSProperties}>
            {b}
          </li>
        ))}
      </ul>
      <p className="ex-tag">+ ONDC integration</p>
    </div>
  );
}

function Latency() {
  return (
    <div className="ex-bars">
      <p className="ex-kicker">MongoDB query latency</p>
      <div className="ex-bar-row">
        <span>Before</span>
        <span className="ex-bar ex-bar-before" />
        <strong>500–2,000 ms</strong>
      </div>
      <div className="ex-bar-row">
        <span>After</span>
        <span className="ex-bar ex-bar-after" />
        <strong>5–50 ms</strong>
      </div>
      <p className="ex-mono">compound + unique indexes, measured with k6</p>
    </div>
  );
}

function Rnd() {
  return (
    <div className="ex-tree">
      <p className="ex-kicker">~/rnd</p>
      <ul>
        {RND.map((r, i) => (
          <li key={r} style={{ '--n': i } as React.CSSProperties}>
            <span aria-hidden>{i === RND.length - 1 ? '└─' : '├─'}</span> {r}
          </li>
        ))}
      </ul>
      <p className="ex-mono">one lead, every .NET R&amp;D project</p>
    </div>
  );
}

function Ai() {
  return (
    <div className="ex-grid">
      <p className="ex-kicker">MCP server · 40+ tools</p>
      <div className="ex-cells">
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} style={{ '--n': i } as React.CSSProperties} />
        ))}
      </div>
      <p className="ex-big ex-big-sm">~₹10,000</p>
      <p className="ex-mono">a month saved, models on our own GPU server</p>
    </div>
  );
}

function Agents() {
  return (
    <div className="ex-org">
      <p className="ex-kicker">The team today</p>
      <div className="ex-org-row">
        <span className="ex-org-node ex-org-you">You</span>
      </div>
      <div className="ex-org-row">
        <span className="ex-org-node ex-org-lead">Claude Code · lead</span>
      </div>
      <div className="ex-org-row">
        <span className="ex-org-node">Antigravity · build</span>
        <span className="ex-org-node">Copilot · review</span>
        <span className="ex-org-node">Codex · review</span>
      </div>
      <div className="ex-bar-row">
        <span>Answer time</span>
        <span className="ex-bar ex-bar-shrink" />
        <strong>40 s → 13 s</strong>
      </div>
    </div>
  );
}

const EXHIBITS: Record<ExhibitKind, () => React.ReactElement> = { degree: Degree, brands: Brands, latency: Latency, rnd: Rnd, ai: Ai, agents: Agents };

export function ChapterExhibit({ kind }: { kind: ExhibitKind }) {
  const Exhibit = EXHIBITS[kind];
  return (
    <aside className="ed-exhibit ed-reveal" aria-hidden>
      <Exhibit />
    </aside>
  );
}
