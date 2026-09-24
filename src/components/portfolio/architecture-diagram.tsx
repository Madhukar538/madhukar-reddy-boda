'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Diagram, DiagramEdge, DiagramNode, NodeKind } from '@/data/diagrams';

const NODE_W = 132;
const NODE_H = 54;
const STEP_MS = 950;
const VIEW_W = 760;

const kindColor: Record<NodeKind, string> = {
  client: 'var(--sys-teal)',
  service: 'var(--primary)',
  ai: 'var(--sys-purple)',
  data: 'var(--sys-orange)',
};

const kindLabel: Record<NodeKind, string> = {
  client: 'Client',
  service: 'Service',
  ai: 'AI',
  data: 'Data',
};

/** Curved connector between two node boxes, leaving from the facing sides. */
function edgePath(a: DiagramNode, b: DiagramNode) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy) * 1.2) {
    const sx = a.x + Math.sign(dx) * (NODE_W / 2);
    const ex = b.x - Math.sign(dx) * (NODE_W / 2);
    const mx = (ex - sx) / 2;
    return `M ${sx} ${a.y} C ${sx + mx} ${a.y}, ${ex - mx} ${b.y}, ${ex} ${b.y}`;
  }
  const sy = a.y + Math.sign(dy) * (NODE_H / 2);
  const ey = b.y - Math.sign(dy) * (NODE_H / 2);
  const my = (ey - sy) / 2;
  return `M ${a.x} ${sy} C ${a.x} ${sy + my}, ${b.x} ${ey - my}, ${b.x} ${ey}`;
}

type Travel = { edge: DiagramEdge; reverse: boolean };

function parseStep(step: string[], edges: Map<string, DiagramEdge>): Travel[] {
  return step
    .map((ref) => ({ edge: edges.get(ref.replace(/^-/, '')), reverse: ref.startsWith('-') }))
    .filter((t): t is Travel => !!t.edge);
}

export function ArchitectureDiagram({ diagram }: { diagram: Diagram }) {
  const nodes = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram]);
  const edges = useMemo(() => new Map(diagram.edges.map((e) => [e.id, e])), [diagram]);

  const [flowIndex, setFlowIndex] = useState(0);
  const flow = diagram.flows[flowIndex];
  const steps = useMemo(() => flow.steps.map((s) => parseStep(s, edges)), [flow, edges]);

  // step: -1 = idle at the start, steps.length = finished.
  // Mirrored in a ref so the animation loop never runs side effects inside a state updater.
  const [anim, setAnimState] = useState({ step: -1, progress: 0 });
  const animRef = useRef(anim);
  const setAnim = useCallback((next: { step: number; progress: number }) => {
    animRef.current = next;
    setAnimState(next);
  }, []);
  const stepIndex = anim.step;
  const progress = anim.progress;
  const [playing, setPlaying] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [selected, setSelected] = useState<string>(() => {
    const first = parseStep(diagram.flows[0].steps[0], new Map(diagram.edges.map((e) => [e.id, e])))[0];
    return first ? first.edge.from : diagram.nodes[0].id;
  });

  const pathRefs = useRef(new Map<string, SVGPathElement>());
  const containerRef = useRef<HTMLElement>(null);
  const reducedMotion = useRef(false);

  // Nodes the request has reached so far, and the ones it is heading to.
  const visited = useMemo(() => {
    const set = new Set<string>();
    steps.slice(0, Math.max(stepIndex, 0)).forEach((travels) =>
      travels.forEach(({ edge, reverse }) => {
        set.add(reverse ? edge.to : edge.from);
        set.add(reverse ? edge.from : edge.to);
      })
    );
    if (stepIndex >= 0 && steps[0]) steps[0].forEach(({ edge, reverse }) => set.add(reverse ? edge.to : edge.from));
    return set;
  }, [steps, stepIndex]);

  const current = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : [];
  const activeEdges = new Set(current.map((t) => t.edge.id));
  const targets = new Set(current.map(({ edge, reverse }) => (reverse ? edge.from : edge.to)));

  const restart = useCallback(() => {
    setAnim({ step: -1, progress: 0 });
    setPlaying(false);
    const first = steps[0]?.[0];
    if (first) setSelected(first.reverse ? first.edge.to : first.edge.from);
  }, [steps, setAnim]);

  const play = () => {
    if (stepIndex >= steps.length || stepIndex < 0) setAnim({ step: 0, progress: 0 });
    setPlaying(true);
  };

  const stepOnce = () => {
    setPlaying(false);
    const next = stepIndex >= steps.length ? 0 : stepIndex + 1;
    if (next >= steps.length) {
      setAnim({ step: steps.length, progress: 0 });
      return;
    }
    setAnim({ step: next, progress: 1 });
    const t = steps[next][0];
    if (t) setSelected(t.reverse ? t.edge.from : t.edge.to);
  };

  // Animation loop: advance the packet, and move to the next step when it arrives.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      let { step, progress: p } = animRef.current;
      p += (now - last) / STEP_MS;
      last = now;
      if (p >= 1) {
        const arrived = steps[step]?.[0];
        if (arrived) setSelected(arrived.reverse ? arrived.edge.from : arrived.edge.to);
        step += 1;
        p = 0;
      }
      setAnim({ step, progress: p });
      if (step >= steps.length) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, steps, setAnim]);

  // Autoplay once when scrolled into view (unless the user prefers less motion).
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = containerRef.current;
    if (!el || reducedMotion.current) return;
    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          setAnim({ step: 0, progress: 0 });
          setPlaying(true);
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setAnim]);

  // Switching flows starts that flow from the beginning.
  const chooseFlow = (i: number) => {
    setFlowIndex(i);
    setAnim({ step: -1, progress: 0 });
    setPlaying(false);
    const t = parseStep(diagram.flows[i].steps[0], edges)[0];
    if (t) setSelected(t.reverse ? t.edge.to : t.edge.from);
  };

  const packetPosition = (travel: Travel) => {
    const path = pathRefs.current.get(travel.edge.id);
    if (!path) return null;
    const length = path.getTotalLength();
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const at = travel.reverse ? length * (1 - eased) : length * eased;
    return path.getPointAtLength(at);
  };

  const selectedNode = nodes.get(selected) ?? diagram.nodes[0];
  const finished = stepIndex >= steps.length;

  // Ordered node list for the mobile stepper.
  const flowNodes = useMemo(() => {
    const order: string[] = [];
    flow.steps.forEach((step) =>
      parseStep(step, edges).forEach(({ edge, reverse }) => {
        const [a, b] = reverse ? [edge.to, edge.from] : [edge.from, edge.to];
        if (order[order.length - 1] !== a && !order.includes(a)) order.push(a);
        if (order[order.length - 1] !== b) order.push(b);
      })
    );
    return order.map((id, i) => ({ node: nodes.get(id)!, key: `${id}-${i}` }));
  }, [flow, edges, nodes]);

  return (
    <figure ref={containerRef} id="architecture" className="my-8 scroll-mt-28">
      <div className="glass p-4 md:p-6">
        {/* Header + controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Interactive diagram</p>
            <h2 className="text-xl font-bold text-foreground">{diagram.title}</h2>
            <p className="text-sm text-muted-foreground">{diagram.caption}</p>
          </div>
          <div className="flex items-center gap-1 self-start">
            <button
              type="button"
              onClick={playing ? () => setPlaying(false) : play}
              className="tinted-button !px-3.5 !py-1.5 !text-[13px]"
              aria-label={playing ? 'Pause' : 'Play request'}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : finished ? 'Replay' : 'Play'}
            </button>
            <button
              type="button"
              onClick={stepOnce}
              aria-label="Next step"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
            >
              <StepForward className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Restart"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/10 hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {diagram.flows.length > 1 && (
          <div className="mb-4 glass-inset inline-flex rounded-full p-1" role="tablist" aria-label="Request flow">
            {diagram.flows.map((f, i) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={i === flowIndex}
                onClick={() => chooseFlow(i)}
                className={cn(
                  'relative rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  i === flowIndex ? 'text-primary-foreground' : 'text-foreground/65 hover:text-foreground'
                )}
              >
                {i === flowIndex && (
                  <m.span
                    layoutId={`flow-${uid}`}
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Desktop / tablet: the SVG diagram */}
        <div className="hidden sm:block">
          <svg
            viewBox={`0 0 ${VIEW_W} ${diagram.height}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label={`${diagram.title}. Select a component for details.`}
          >
            <defs>
              <marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-foreground/35" />
              </marker>
              <filter id={`glow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>

            {diagram.edges.map((edge) => {
              const a = nodes.get(edge.from)!;
              const b = nodes.get(edge.to)!;
              const active = activeEdges.has(edge.id);
              return (
                <path
                  key={edge.id}
                  ref={(el) => {
                    if (el) pathRefs.current.set(edge.id, el);
                  }}
                  d={edgePath(a, b)}
                  fill="none"
                  strokeWidth={active ? 2.25 : 1.5}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow-${uid})`}
                  markerStart={edge.twoWay ? `url(#arrow-${uid})` : undefined}
                  className={cn('transition-[stroke] duration-300', active ? 'stroke-primary' : 'stroke-foreground/20')}
                  strokeDasharray={active ? '6 6' : undefined}
                  style={active ? { animation: 'diagram-dash 0.6s linear infinite' } : undefined}
                />
              );
            })}

            {diagram.nodes.map((node) => {
              const isTarget = targets.has(node.id);
              const isVisited = visited.has(node.id);
              const isSelected = selected === node.id;
              const color = kindColor[node.kind];
              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label}: ${node.sub}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelected(node.id);
                    setPlaying(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(node.id);
                      setPlaying(false);
                    }
                  }}
                  className="cursor-pointer outline-none [&:focus-visible>rect:first-child]:stroke-primary"
                  transform={`translate(${node.x - NODE_W / 2} ${node.y - NODE_H / 2})`}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={16}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{
                      fill: isTarget || isSelected ? `hsl(${color} / 0.16)` : isVisited ? `hsl(${color} / 0.08)` : 'hsl(var(--foreground) / 0.04)',
                      stroke: isSelected ? `hsl(${color})` : isTarget ? `hsl(${color} / 0.7)` : 'hsl(var(--foreground) / 0.14)',
                      transition: 'fill 300ms, stroke 300ms',
                    }}
                  />
                  <circle cx={14} cy={NODE_H / 2} r={4} style={{ fill: `hsl(${color})` }} />
                  <text x={26} y={23} className="fill-foreground text-[13px] font-semibold">
                    {node.label}
                  </text>
                  <text x={26} y={39} className="fill-foreground/55 text-[10.5px]">
                    {node.sub}
                  </text>
                </g>
              );
            })}

            {/* Request packets */}
            {current.map((travel) => {
              const point = packetPosition(travel);
              if (!point) return null;
              return (
                <g key={`${travel.edge.id}-${travel.reverse}`} pointerEvents="none">
                  <circle cx={point.x} cy={point.y} r={9} filter={`url(#glow-${uid})`} className="fill-primary/60" />
                  <circle cx={point.x} cy={point.y} r={5} className="fill-primary" />
                  <circle cx={point.x} cy={point.y} r={2} className="fill-white" />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mobile: vertical stepper for the current flow */}
        <ol className="sm:hidden space-y-2">
          {flowNodes.map(({ node, key }) => {
            const isTarget = targets.has(node.id);
            const isSelected = selected === node.id;
            const color = kindColor[node.kind];
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(node.id);
                    setPlaying(false);
                  }}
                  aria-pressed={isSelected}
                  className="glass-inset flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  style={{
                    background: isTarget || isSelected ? `hsl(${color} / 0.14)` : undefined,
                    boxShadow: isSelected ? `inset 0 0 0 1.5px hsl(${color})` : undefined,
                  }}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `hsl(${color})` }} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-foreground">{node.label}</span>
                    <span className="block text-xs text-muted-foreground">{node.sub}</span>
                  </span>
                  {isTarget && <span className="h-2 w-2 animate-ping rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Detail panel */}
        <m.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-inset mt-4 p-4"
          aria-live="polite"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${kindColor[selectedNode.kind]})` }} />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {kindLabel[selectedNode.kind]}
            </span>
          </div>
          <p className="text-base font-bold text-foreground">
            {selectedNode.label} <span className="font-normal text-muted-foreground">· {selectedNode.sub}</span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">{selectedNode.what}</p>
          {selectedNode.note && (
            <p className="mt-2 text-sm leading-relaxed text-primary">{selectedNode.note}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedNode.tech.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        </m.div>

        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(Object.keys(kindLabel) as NodeKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${kindColor[k]})` }} />
              {kindLabel[k]}
            </span>
          ))}
          <span className="ml-auto hidden sm:inline">Click any component for details</span>
        </figcaption>
      </div>
    </figure>
  );
}
