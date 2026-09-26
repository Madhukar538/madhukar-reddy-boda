'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { Maximize2 } from 'lucide-react';
import type { GraphNode, GraphNodeType } from '@/lib/knowledge-graph';
import type { LocalGraph } from '@/lib/vault';

type Node = GraphNode & SimulationNodeDatum;

const COLOR: Record<GraphNodeType, string> = {
  project: 'var(--primary)',
  lab: 'var(--sys-purple)',
  post: 'var(--sys-teal)',
  tech: 'var(--sys-orange)',
};

const W = 256;
const H = 220;

/** Obsidian's local graph: this post and its neighbourhood, laid out once (no animation loop). */
export default function LocalGraphView({ graph }: { graph: LocalGraph }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = graph.nodes.map((n) => ({ ...n }));
    const links = graph.links.map((l) => ({ source: l.source, target: l.target }));
    const center = nodes.find((n) => n.id === graph.center);
    if (center) {
      center.fx = 0;
      center.fy = 0;
    }
    forceSimulation(nodes)
      .force('link', forceLink<Node, { source: string | Node; target: string | Node }>(links).id((d) => d.id).distance(42).strength(0.7))
      .force('charge', forceManyBody().strength(-90))
      .force('x', forceX(0).strength(0.08))
      .force('y', forceY(0).strength(0.1))
      .force('collide', forceCollide(12))
      .stop()
      .tick(260);
    // Fit into the viewBox.
    const xs = nodes.map((n) => n.x ?? 0);
    const ys = nodes.map((n) => n.y ?? 0);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
    const k = Math.min(1.4, (Math.min(W, H) - 40) / span);
    nodes.forEach((n) => {
      n.x = (n.x ?? 0) * k;
      n.y = (n.y ?? 0) * k;
    });
    return { nodes, links: links as unknown as { source: Node; target: Node }[] };
  }, [graph]);

  const near = useMemo(() => {
    if (!hover) return null;
    const set = new Set([hover]);
    links.forEach((l) => {
      if (l.source.id === hover) set.add(l.target.id);
      if (l.target.id === hover) set.add(l.source.id);
    });
    return set;
  }, [hover, links]);

  const hovered = nodes.find((n) => n.id === hover);

  return (
    <div className="glass p-3">
      <div className="mb-1 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Local graph</p>
        <Link href="/graph" className="rounded-md p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground" aria-label="Open the full graph" title="Open the full graph">
          <Maximize2 className="h-3.5 w-3.5" />
        </Link>
      </div>
      <svg viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Local graph: ${nodes.length} connected notes`}>
        {links.map((l, i) => {
          const active = !near || (near.has(l.source.id) && near.has(l.target.id));
          return (
            <line
              key={i}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke="hsl(var(--foreground))"
              strokeOpacity={active ? 0.22 : 0.06}
              strokeWidth={0.8}
            />
          );
        })}
        {nodes.map((n) => {
          const isCenter = n.id === graph.center;
          const dim = near && !near.has(n.id);
          const r = isCenter ? 7 : n.type === 'tech' ? 4.5 : 3.5;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              className={n.href && !isCenter ? 'cursor-pointer' : undefined}
              opacity={dim ? 0.25 : 1}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => n.href && !isCenter && router.push(n.href)}
            >
              <circle r={r + 5} fill="transparent" />
              <circle
                r={r}
                fill={`hsl(${COLOR[n.type]})`}
                stroke={isCenter ? 'hsl(var(--background))' : 'none'}
                strokeWidth={isCenter ? 2 : 0}
              />
              {(isCenter || n.type === 'tech') && (
                <text
                  y={r + 9}
                  textAnchor="middle"
                  className="pointer-events-none select-none fill-foreground"
                  fontSize={isCenter ? 8 : 7}
                  fontWeight={isCenter ? 600 : 400}
                  opacity={0.75}
                >
                  {isCenter ? 'This post' : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="min-h-[2.5rem] px-1 text-xs leading-snug text-muted-foreground">
        {hovered ? (
          <>
            <span className="font-medium text-foreground">{hovered.label}</span>
            {hovered.meta ? <> · {hovered.meta}</> : null}
          </>
        ) : (
          'Hover a node to see it; click to open.'
        )}
      </p>
    </div>
  );
}
