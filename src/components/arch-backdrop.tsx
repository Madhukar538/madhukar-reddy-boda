/**
 * Midnight's page backdrop: a faint architecture diagram of the kind of system
 * Madhukar builds (gateway, services, search, a self-hosted LLM, stores), drawn
 * in the side margins, with small red "requests" travelling along the links.
 * SVG + SMIL only, so it needs no JavaScript; hidden outside Midnight and the
 * requests are hidden for reduced motion (.arch-backdrop in globals.css).
 */

type Node = { x: number; y: number; w: number; label: string };

// Desktop: a 1440 × 900 canvas, sliced to the viewport; the centre stays empty.
const nodes: Node[] = [
  { x: 56, y: 118, w: 128, label: 'client' },
  { x: 56, y: 258, w: 128, label: 'api-gateway' },
  { x: 56, y: 398, w: 128, label: 'auth.svc' },
  { x: 56, y: 538, w: 128, label: 'orders.svc' },
  { x: 56, y: 698, w: 128, label: 'k6 · 10k vus' },
  { x: 1256, y: 138, w: 140, label: 'rag-worker' },
  { x: 1256, y: 298, w: 140, label: 'solr 9 · hybrid' },
  { x: 1256, y: 458, w: 140, label: 'llm · self-hosted' },
  { x: 1256, y: 618, w: 140, label: 'postgres' },
  { x: 1256, y: 778, w: 140, label: 'redis' },
];

const links = [
  'M120 154 V258', // client → gateway
  'M120 294 V398', // gateway → auth
  'M120 434 V538', // auth → orders
  'M56 716 H32 V276 H56', // k6 → gateway
  'M184 276 H300 V64 H1140 V156 H1256', // gateway → rag-worker, over the top
  'M1326 174 V298', // rag-worker → solr
  'M1326 334 V458', // solr → llm
  'M1396 476 H1420 V636 H1396', // llm → postgres
  'M1326 654 V778', // postgres → redis
  'M184 556 H260 V836 H1180 V796 H1256', // orders → redis, along the bottom
];

// Requests: which link, how long a trip takes, and when it starts.
const packets = [
  { link: 0, dur: 6, begin: 0 },
  { link: 4, dur: 14, begin: 1.5 },
  { link: 5, dur: 5, begin: 4 },
  { link: 6, dur: 5, begin: 7 },
  { link: 3, dur: 9, begin: 2 },
  { link: 9, dur: 16, begin: 6 },
  { link: 8, dur: 5, begin: 10 },
];

// Phones: a trace down each edge, a few small nodes on it.
const phoneLinks = ['M14 0 V844', 'M376 0 V844'];
const phoneNodes = [
  { x: 14, y: 210 }, { x: 14, y: 520 }, { x: 14, y: 760 },
  { x: 376, y: 140 }, { x: 376, y: 430 }, { x: 376, y: 680 },
];

export function ArchBackdrop() {
  return (
    <>
      <svg className="arch-backdrop arch-wide" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g className="arch-lines">
          {links.map((d) => <path key={d} d={d} />)}
        </g>
        {nodes.map((n) => (
          <g key={n.label} className="arch-node">
            <rect x={n.x} y={n.y} width={n.w} height={36} rx={4} />
            <text x={n.x + 12} y={n.y + 22}>{n.label}</text>
          </g>
        ))}
        {packets.map((p, i) => (
          <circle key={i} r={2.5} className="arch-packet">
            <animateMotion dur={`${p.dur}s`} begin={`${p.begin}s`} repeatCount="indefinite" path={links[p.link]} />
          </circle>
        ))}
      </svg>

      <svg className="arch-backdrop arch-phone" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g className="arch-lines">
          {phoneLinks.map((d) => <path key={d} d={d} />)}
        </g>
        {phoneNodes.map((n) => (
          <rect key={`${n.x}-${n.y}`} className="arch-node" x={n.x - 4} y={n.y - 4} width={8} height={8} rx={1.5} />
        ))}
        {phoneLinks.map((d, i) => (
          <circle key={d} r={2} className="arch-packet">
            <animateMotion dur="11s" begin={`${i * 4}s`} repeatCount="indefinite" path={d} />
          </circle>
        ))}
      </svg>
    </>
  );
}
