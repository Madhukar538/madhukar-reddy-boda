'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { ArrowUpRight, Maximize2, Minus, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GraphNode, GraphNodeType, KnowledgeGraph } from '@/lib/knowledge-graph';

type SimNode = GraphNode & SimulationNodeDatum & { degree: number };
type SimLink = SimulationLinkDatum<SimNode>;

const TYPE_STYLE: Record<GraphNodeType, { label: string; color: string }> = {
  project: { label: 'Projects', color: 'var(--primary)' },
  lab: { label: 'Lab', color: 'var(--sys-purple)' },
  post: { label: 'Posts', color: 'var(--sys-teal)' },
  tech: { label: 'Tech', color: 'var(--sys-orange)' },
};

const radius = (n: SimNode) =>
  n.type === 'tech' ? Math.min(6 + n.degree * 1.3, 20) : n.type === 'project' ? 9 : n.type === 'post' ? 8 : 7;

const short = (s: string, max = 26) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

export function KnowledgeGraphView({ graph }: { graph: KnowledgeGraph }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [, setFrame] = useState(0);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<GraphNodeType>>(new Set());
  const [query, setQuery] = useState('');

  // Simulation data (stable across renders).
  const { nodes, links, neighbours } = useMemo(() => {
    const degree = new Map<string, number>();
    graph.links.forEach((l) => {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    });
    const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 }));
    const simLinks: SimLink[] = graph.links.map((l) => ({ source: l.source, target: l.target }));
    const nb = new Map<string, Set<string>>();
    graph.links.forEach(({ source, target }) => {
      if (!nb.has(source)) nb.set(source, new Set());
      if (!nb.has(target)) nb.set(target, new Set());
      nb.get(source)!.add(target);
      nb.get(target)!.add(source);
    });
    return { nodes: simNodes, links: simLinks, neighbours: nb };
  }, [graph]);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Track container size.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      setSize({ w, h: Math.round(Math.min(Math.max(w * 0.7, 420), 640)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Run the force simulation; re-render on each tick.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sim = forceSimulation<SimNode, SimLink>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance((l) => {
        const s = l.source as SimNode;
        const t = l.target as SimNode;
        return s.type === 'tech' || t.type === 'tech' ? 60 : 90;
      }).strength(0.5))
      .force('charge', forceManyBody<SimNode>().strength((d) => (d.type === 'tech' ? -220 : -140)))
      .force('center', forceCenter(0, 0))
      .force('x', forceX<SimNode>(0).strength(0.05))
      .force('y', forceY<SimNode>(0).strength(0.07))
      .force('collide', forceCollide<SimNode>((d) => radius(d) + 6));
    simRef.current = sim;
    // Settle most of the layout before the first paint, then fit it to the canvas.
    sim.stop();
    sim.tick(reduced ? 300 : 220);
    fitRef.current();
    if (!reduced) {
      // Keep a little live motion so the graph feels physical.
      sim.alpha(0.12).on('tick', () => setFrame((f) => f + 1)).restart();
    }
    setFrame((f) => f + 1);
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [nodes, links]);

  // Zoom and pan so every visible node fits inside the canvas.
  const fitView = useCallback(() => {
    const shown = nodes.filter((n) => !hidden.has(n.type) && n.x != null && n.y != null);
    if (!shown.length) return;
    const pad = 48;
    const xs = shown.map((n) => n.x!);
    const ys = shown.map((n) => n.y!);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const k = Math.min(Math.max(Math.min((size.w - pad * 2) / (maxX - minX || 1), (size.h - pad * 2) / (maxY - minY || 1)), 0.4), 1.6);
    setView({ k, x: -((minX + maxX) / 2) * k, y: -((minY + maxY) / 2) * k });
  }, [nodes, hidden, size]);
  const fitRef = useRef(fitView);
  fitRef.current = fitView;

  // Re-fit when the canvas is resized.
  useEffect(() => {
    fitRef.current();
  }, [size]);

  // Screen <-> graph coordinates.
  const toGraph = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - size.w / 2 - view.x) / view.k,
        y: (clientY - rect.top - size.h / 2 - view.y) / view.k,
      };
    },
    [size, view]
  );

  // Pointer handling: drag nodes, pan the background.
  const drag = useRef<{ mode: 'node' | 'pan'; id?: string; startX: number; startY: number; vx: number; vy: number; moved: boolean } | null>(null);

  const onPointerDownNode = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { mode: 'node', id, startX: e.clientX, startY: e.clientY, vx: 0, vy: 0, moved: false };
    const n = byId.get(id)!;
    n.fx = n.x;
    n.fy = n.y;
    simRef.current?.alphaTarget(0.25).restart();
  };

  const onPointerDownBg = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, vx: view.x, vy: view.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 3) d.moved = true;
    if (d.mode === 'node' && d.id) {
      const p = toGraph(e.clientX, e.clientY);
      const n = byId.get(d.id)!;
      n.fx = p.x;
      n.fy = p.y;
    } else if (d.mode === 'pan') {
      setView((v) => ({ ...v, x: d.vx + (e.clientX - d.startX), y: d.vy + (e.clientY - d.startY) }));
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.mode === 'node' && d.id) {
      const n = byId.get(d.id)!;
      n.fx = null;
      n.fy = null;
      simRef.current?.alphaTarget(0);
      if (!d.moved) setSelected((s) => (s === d.id ? null : d.id!));
    } else if (d.mode === 'pan' && !d.moved) {
      setSelected(null);
    }
  };

  const zoomBy = (factor: number) => setView((v) => ({ ...v, k: Math.min(Math.max(v.k * factor, 0.4), 3) }));

  // Wheel zoom around the cursor (non-passive so the page doesn't scroll).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left - size.w / 2;
      const cy = e.clientY - rect.top - size.h / 2;
      setView((v) => {
        const k = Math.min(Math.max(v.k * Math.exp(-e.deltaY * 0.0015), 0.4), 3);
        const ratio = k / v.k;
        return { k, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [size]);

  // Search: select and centre the best match.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => n.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query, nodes]);

  const focusNode = (id: string) => {
    const n = byId.get(id);
    if (!n) return;
    setSelected(id);
    setQuery('');
    setView((v) => ({ k: Math.max(v.k, 1.3), x: -(n.x ?? 0) * Math.max(v.k, 1.3), y: -(n.y ?? 0) * Math.max(v.k, 1.3) }));
  };

  const focus = hovered ?? selected;
  const focusSet = focus ? new Set([focus, ...(neighbours.get(focus) ?? [])]) : null;
  const visible = (n: SimNode) => !hidden.has(n.type);
  const selectedNode = selected ? byId.get(selected) : null;
  const selectedNeighbours = selected
    ? [...(neighbours.get(selected) ?? [])].map((id) => byId.get(id)!).filter(Boolean).sort((a, b) => a.type.localeCompare(b.type))
    : [];

  const counts = useMemo(() => {
    const c: Record<GraphNodeType, number> = { project: 0, lab: 0, post: 0, tech: 0 };
    nodes.forEach((n) => (c[n.type] += 1));
    return c;
  }, [nodes]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="glass overflow-hidden">
        {/* Toolbar */}
        <div className="relative z-30 flex flex-wrap items-center gap-2 border-b border-foreground/10 p-3">
          {(Object.keys(TYPE_STYLE) as GraphNodeType[]).map((t) => {
            const off = hidden.has(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={!off}
                onClick={() =>
                  setHidden((h) => {
                    const next = new Set(h);
                    if (next.has(t)) next.delete(t);
                    else next.add(t);
                    return next;
                  })
                }
                className={cn('chip transition-opacity', off && 'opacity-40')}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${TYPE_STYLE[t].color})` }} />
                {TYPE_STYLE[t].label} <span className="opacity-60 tabular-nums">{counts[t]}</span>
              </button>
            );
          })}
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a node…"
              aria-label="Find a node"
              className="glass-inset w-full rounded-full py-1.5 pl-8 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
            {matches.length > 0 && (
              <ul className="glass glass-strong absolute right-0 top-full z-20 mt-1 w-full p-1" style={{ ['--glass-radius' as string]: '1rem' }}>
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => focusNode(m.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm text-foreground/85 hover:bg-foreground/10"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(${TYPE_STYLE[m.type].color})` }} />
                      <span className="truncate">{m.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div ref={wrapRef} className="relative touch-none">
          <svg
            ref={svgRef}
            width={size.w}
            height={size.h}
            className="block cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onPointerDownBg}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="img"
            aria-label="Knowledge graph of projects, Lab experiments, blog posts and technologies"
          >
            <g transform={`translate(${size.w / 2 + view.x} ${size.h / 2 + view.y}) scale(${view.k})`}>
              {links.map((l, i) => {
                const s = l.source as SimNode;
                const t = l.target as SimNode;
                if (!visible(s) || !visible(t) || s.x == null || t.x == null) return null;
                const lit = focusSet && focusSet.has(s.id) && focusSet.has(t.id) && (s.id === focus || t.id === focus);
                return (
                  <line
                    key={i}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    strokeWidth={lit ? 1.6 / view.k + 0.6 : 1}
                    className={cn(lit ? 'stroke-primary/70' : 'stroke-foreground/15', focusSet && !lit && 'opacity-30')}
                  />
                );
              })}
              {nodes.map((n) => {
                if (!visible(n) || n.x == null) return null;
                const r = radius(n);
                const dim = focusSet && !focusSet.has(n.id);
                const isSel = selected === n.id;
                const showLabel = n.type === 'tech' || view.k > 1.35 || (focusSet?.has(n.id) ?? false);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x} ${n.y})`}
                    className={cn('cursor-pointer transition-opacity duration-200', dim && 'opacity-20')}
                    onPointerDown={(e) => onPointerDownNode(e, n.id)}
                    onPointerEnter={() => setHovered(n.id)}
                    onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
                  >
                    <circle
                      r={r + (isSel ? 3 : 0)}
                      style={{
                        fill: `hsl(${TYPE_STYLE[n.type].color} / ${n.type === 'tech' ? 0.85 : 0.95})`,
                        stroke: isSel ? 'hsl(var(--foreground))' : 'hsl(var(--background) / 0.9)',
                        strokeWidth: isSel ? 2.5 : 1.5,
                      }}
                    />
                    {showLabel && (
                      <text
                        y={r + 11}
                        textAnchor="middle"
                        className={cn('pointer-events-none fill-foreground', n.type === 'tech' ? 'text-[10px] font-semibold' : 'text-[9px]')}
                        style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background) / 0.85)', strokeWidth: 3 }}
                      >
                        {short(n.label, n.type === 'tech' ? 22 : 30)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            {[
              { icon: Plus, label: 'Zoom in', fn: () => zoomBy(1.25) },
              { icon: Minus, label: 'Zoom out', fn: () => zoomBy(0.8) },
              { icon: Maximize2, label: 'Fit to view', fn: fitView },
            ].map(({ icon: Icon, label, fn }) => (
              <button
                key={label}
                type="button"
                onClick={fn}
                aria-label={label}
                className="glass glass-pill flex h-8 w-8 items-center justify-center text-foreground/80 hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <p className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-muted-foreground">
            Drag to move · scroll to zoom · click a node
          </p>
        </div>
      </div>

      {/* Detail panel */}
      <aside className="glass p-5" aria-live="polite">
        {selectedNode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${TYPE_STYLE[selectedNode.type].color})` }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedNode.meta ?? TYPE_STYLE[selectedNode.type].label}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug text-foreground">{selectedNode.label}</h3>
            {selectedNode.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{selectedNode.description}</p>
            )}
            {selectedNode.href && (
              <Link href={selectedNode.href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Connected ({selectedNeighbours.length})
              </p>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {selectedNeighbours.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => focusNode(n.id)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm text-foreground/85 hover:bg-foreground/10"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(${TYPE_STYLE[n.type].color})` }} />
                      <span className="truncate">{n.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="text-base font-semibold text-foreground">How it connects</p>
            <p>
              Every project, Lab experiment and post links to the technologies it uses. Technologies shared by
              several pieces of work become hubs, so clusters show where my experience runs deepest.
            </p>
            <p>Click any node to see what it connects to, or search for a technology.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
