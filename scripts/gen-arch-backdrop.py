"""Generates Midnight's scrolling page backdrop (public/arch/*.svg): a faint
architecture diagram down each side of the page, tiled vertically, with small
red "requests" travelling along the links. Colours are baked in because CSS
variables don't reach SVGs used as background images.

    python3 scripts/gen-arch-backdrop.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public' / 'arch'
INK = '#EDE8E1'      # Midnight --foreground
PAGE = '#110F0D'     # Midnight --background
RED = '#DD504B'      # Midnight --primary (the collar red)
W, H = 230, 1800     # side tile; repeats down the page
NODE_W, NODE_H = 136, 32

LEFT = ['client', 'cdn · edge', 'rate-limiter', 'api-gateway', 'auth.svc', 'catalog.svc',
        'cart.svc', 'orders.svc', 'payments.svc', 'otel-collector', 'grafana', 'k6 · 10k vus']
RIGHT = ['rag-worker', 'embedder', 'solr 9 · hybrid', 'vector-index', 'llm · self-hosted', 'mcp-server',
         'rabbitmq', 'postgres', 'mongodb', 'redis', 'blob-store', 'cron.jobs']

STYLE = f'''<style>
.l{{fill:none;stroke:{INK};stroke-opacity:.09;stroke-width:1}}
.n{{fill:{PAGE};stroke:{INK};stroke-opacity:.15;stroke-width:1}}
.t{{fill:{INK};fill-opacity:.24;font:11px ui-monospace,'SF Mono',Menlo,Consolas,monospace;letter-spacing:.02em}}
.p{{fill:{RED};fill-opacity:.75}}
</style>'''


def packet(path, dur, begin, r=2.2):
    return (f'<circle r="{r}" class="p"><animateMotion dur="{dur}s" begin="{begin}s" '
            f'repeatCount="indefinite" path="{path}"/></circle>')


def side(labels, left):
    trunk = 20 if left else W - 20
    nx = 44 if left else W - 44 - NODE_W
    step = H // len(labels)
    lines, nodes, packets = [f'M{trunk} 0 V{H}'], [], []
    for i, label in enumerate(labels):
        y = i * step + (step - NODE_H) // 2
        mid = y + NODE_H // 2
        edge = nx if left else nx + NODE_W
        branch = f'M{trunk} {mid} H{edge}'
        lines.append(branch)
        nodes.append(f'<rect class="n" x="{nx}" y="{y}" width="{NODE_W}" height="{NODE_H}" rx="4"/>'
                     f'<text class="t" x="{nx + 10}" y="{y + 20}">{label}</text>')
        # Every other node calls the next one directly.
        if i % 2 == 0 and i + 1 < len(labels):
            cx = nx + (NODE_W - 24 if left else 24)
            link = f'M{cx} {y + NODE_H} V{y + step}'
            lines.append(link)
            packets.append(packet(link, 3 + i % 3, i * 0.7))
        if i % 3 == 1:
            packets.append(packet(branch, 2.5, i * 0.9))
    packets.append(packet(f'M{trunk} 0 V{H}', 22, 0, 2.6))
    packets.append(packet(f'M{trunk} 0 V{H}', 22, 11, 2.6))
    body = ''.join(f'<path class="l" d="{d}"/>' for d in lines) + ''.join(nodes) + ''.join(packets)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{STYLE}{body}</svg>'


def bus():
    # Stretched to the page width: a link across the page every 900px, faded in the middle.
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" preserveAspectRatio="none">'
            f'<defs><linearGradient id="g"><stop offset="0" stop-color="{INK}" stop-opacity=".09"/>'
            f'<stop offset=".22" stop-color="{INK}" stop-opacity=".06"/><stop offset=".5" stop-color="{INK}" stop-opacity="0"/>'
            f'<stop offset=".78" stop-color="{INK}" stop-opacity=".06"/><stop offset="1" stop-color="{INK}" stop-opacity=".09"/></linearGradient></defs>'
            f'<path d="M0 450 H1440" stroke="url(#g)" stroke-width="1" vector-effect="non-scaling-stroke" fill="none"/></svg>')


def edge(left):
    # Phones and narrower desktops: a trace in each 16px margin, with small
    # nodes and their service names set vertically beside it, like a schematic.
    w, h = 18, 1400
    x = 3 if left else w - 3
    labels = (['api-gateway', 'auth.svc', 'orders.svc', 'k6 · load'] if left
              else ['rag-worker', 'solr 9', 'llm · local', 'redis'])
    first = 120 if left else 300
    parts = []
    for i, label in enumerate(labels):
        y = first + i * 350
        parts.append(f'<rect class="n" x="{x - 2.5}" y="{y - 2.5}" width="5" height="5" rx="1"/>')
        # rotate(90): reads top to bottom, glyphs to the right of the baseline.
        bx = 7 if left else 4
        parts.append(f'<text class="t e" transform="translate({bx} {y + 10}) rotate(90)">{label}</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{STYLE}'
            f'<style>.e{{font-size:8.5px;letter-spacing:.08em;fill-opacity:.2}}</style>'
            f'<path class="l" d="M{x} 0 V{h}"/>{"".join(parts)}{packet(f"M{x} 0 V{h}", 16, 0 if left else 7, 1.8)}</svg>')


OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'left.svg').write_text(side(LEFT, True))
(OUT / 'right.svg').write_text(side(RIGHT, False))
(OUT / 'bus.svg').write_text(bus())
(OUT / 'edge-left.svg').write_text(edge(True))
(OUT / 'edge-right.svg').write_text(edge(False))
print('wrote', sorted(p.name for p in OUT.iterdir()))
