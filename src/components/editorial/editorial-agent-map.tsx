/**
 * The middle of the Editorial hero: a live map of how he ships. Work flows from You to the lead
 * (Claude Code), out to the builders (Antigravity), through review (Copilot and Codex) and back to
 * You, as orange packets that loop forever. Pure SVG animation: no script, nothing to load, and the
 * packets are hidden with reduced motion (globals.css). Decorative: the same story is in the text.
 */

const CYCLE = 6; // seconds for one round trip

type Leg = { id: string; d: string; from: number; to: number };

const BUILDERS = [70, 135, 200, 265, 330];
const REVIEW = { copilot: { x: 470, y: 140 }, codex: { x: 470, y: 260 } };

const legs: Leg[] = [
  { id: 'spec', d: 'M60,200 L190,200', from: 0, to: 0.13 },
  ...BUILDERS.map((y, i) => ({ id: `task${i}`, d: `M190,200 L340,${y}`, from: 0.14 + i * 0.02, to: 0.32 + i * 0.02 })),
  ...BUILDERS.map((y, i) => {
    const r = i < 3 ? REVIEW.copilot : REVIEW.codex;
    return { id: `pr${i}`, d: `M340,${y} L${r.x},${r.y}`, from: 0.42 + i * 0.02, to: 0.56 + i * 0.02 };
  }),
  { id: 'back1', d: 'M470,140 C505,10 70,0 60,176', from: 0.66, to: 0.92 },
  { id: 'back2', d: 'M470,260 C505,395 70,405 60,224', from: 0.68, to: 0.94 },
];

function Packet({ leg }: { leg: Leg }) {
  const t = (n: number) => n.toFixed(3);
  const times = `0;${t(leg.from)};${t(leg.to)};1`;
  return (
    <circle className="ed-map-packet" r="4.5">
      <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes={times} calcMode="linear">
        <mpath href={`#ed-map-${leg.id}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        dur={`${CYCLE}s`}
        repeatCount="indefinite"
        values="0;0;1;1;0;0"
        keyTimes={`0;${t(Math.max(0, leg.from - 0.001))};${t(leg.from)};${t(leg.to)};${t(Math.min(1, leg.to + 0.001))};1`}
      />
    </circle>
  );
}

export function EditorialAgentMap() {
  return (
    <figure className="ed-map" aria-hidden>
      <figcaption>
        <span className="ed-map-live" /> How I ship · live
      </figcaption>
      <svg viewBox="0 0 520 400" role="presentation">
        <g className="ed-map-lines">
          {legs.map((leg) => (
            <path key={leg.id} id={`ed-map-${leg.id}`} d={leg.d} className={leg.id.startsWith('back') ? 'ed-map-return' : undefined} />
          ))}
        </g>

        {/* You */}
        <circle cx="60" cy="200" r="24" className="ed-map-you" />
        <text x="60" y="204" className="ed-map-in">YOU</text>
        <text x="60" y="246" className="ed-map-note">spec · merge</text>

        {/* The lead */}
        <circle cx="190" cy="200" r="34" className="ed-map-lead" />
        <text x="190" y="196" className="ed-map-in ed-map-in-light">CLAUDE</text>
        <text x="190" y="209" className="ed-map-in ed-map-in-light">CODE</text>
        <text x="190" y="254" className="ed-map-note">lead · plans</text>

        {/* Builders */}
        {BUILDERS.map((y) => (
          <circle key={y} cx="340" cy={y} r="11" className="ed-map-node" />
        ))}
        <text x="340" y="30" className="ed-map-label">ANTIGRAVITY</text>
        <text x="340" y="372" className="ed-map-note">builders</text>

        {/* Review */}
        <rect x="438" y="124" width="64" height="32" className="ed-map-node" />
        <text x="470" y="144" className="ed-map-in">COPILOT</text>
        <rect x="438" y="244" width="64" height="32" className="ed-map-node" />
        <text x="470" y="264" className="ed-map-in">CODEX</text>
        <text x="470" y="200" className="ed-map-note">review</text>

        {legs.map((leg) => (
          <Packet key={leg.id} leg={leg} />
        ))}
      </svg>
    </figure>
  );
}
