import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { getThemeSettings } from '@/lib/content';
import type { DesignStyle } from '@/lib/design-style';

// The cut-out portrait, inlined so the card needs no extra request.
const portrait = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/og/portrait.png')).toString('base64')}`;

// Inter (SIL Open Font License, see og-fonts/LICENSE.txt), the site's own typeface,
// and Instrument Serif (OFL, og-fonts/InstrumentSerif-LICENSE.txt) for the title, as on the site.
// The image renderer's built-in font has no bold, so headings came out regular.
const font = (file: string) => readFileSync(join(process.cwd(), 'src/lib/og-fonts', file));
const fonts = [
  { name: 'Inter', data: font('Inter-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: font('Inter-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
  { name: 'Inter', data: font('Inter-ExtraBold.ttf'), weight: 800 as const, style: 'normal' as const },
  { name: 'Instrument Serif', data: font('InstrumentSerif-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
];

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The card's colours follow the site's default look (Admin, Themes), so a shared link looks like the
 * site it opens: background, its lighter corner, ink, muted text, accent, and whether the title is set in the serif.
 */
type Palette = { bg: string; glow: string; ink: string; muted: string; accent: string; serif: boolean };
const PALETTES: Record<DesignStyle, Palette> = {
  midnight: { bg: '#110f0d', glow: '#2a221b', ink: '#ede8e1', muted: '#a1978c', accent: '#db5760', serif: true },
  terminal: { bg: '#f7f7f4', glow: '#ffffff', ink: '#0e0e10', muted: '#55554f', accent: '#5b3bf5', serif: false },
  blueprint: { bg: '#0b2545', glow: '#163f6e', ink: '#e8f1ff', muted: '#9dbbd9', accent: '#5ce1e6', serif: false },
  editorial: { bg: '#f1efea', glow: '#ffffff', ink: '#111111', muted: '#555555', accent: '#ff4d00', serif: false },
  glass: { bg: '#eef2f8', glow: '#ffffff', ink: '#1c1c1e', muted: '#6b6b70', accent: '#0a84ff', serif: false },
  arctic: { bg: '#f1f3f4', glow: '#ffffff', ink: '#10161f', muted: '#4f5966', accent: '#1a4fd6', serif: false },
  synthwave: { bg: '#140a24', glow: '#2a1350', ink: '#f3ebdd', muted: '#b3a8c9', accent: '#fb4ba0', serif: false },
  dune: { bg: '#efe6d6', glow: '#f7efe2', ink: '#2b1d14', muted: '#6b5646', accent: '#a33e24', serif: true },
  gazette: { bg: '#f4f1ea', glow: '#faf8f3', ink: '#151515', muted: '#555555', accent: '#b3261e', serif: true },
  receipt: { bg: '#fffefa', glow: '#f1efea', ink: '#222222', muted: '#666666', accent: '#c62e2e', serif: false },
  observatory: { bg: '#070b18', glow: '#141c3a', ink: '#e6e9f2', muted: '#9aa3bf', accent: '#f5c46b', serif: false },
  bazaar: { bg: '#f6efdf', glow: '#fff8e8', ink: '#2a1a12', muted: '#6e5a48', accent: '#c8102e', serif: false },
};

async function palette(): Promise<Palette> {
  try {
    return PALETTES[(await getThemeSettings()).defaultTheme] ?? PALETTES.midnight;
  } catch {
    return PALETTES.midnight;
  }
}

/** A colour as rgba with the given alpha, for hairlines in the palette's colours. */
const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

type Stat = { value: string; label: string };

/**
 * Shared 1200×630 social card (link previews in WhatsApp, LinkedIn, X…): the
 * portrait on the right, and on the left who it is and what the page is about.
 * Served as JPEG: a photo makes the PNG ~480 KB, and WhatsApp drops preview images
 * much over ~300 KB.
 */
export async function ogCard({
  eyebrow,
  title,
  meta,
  stats,
  stack,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  stats?: Stat[];
  stack?: string[];
}) {
  const titleSize = title.length > 80 ? 40 : title.length > 55 ? 46 : 54;
  const { bg, glow, ink: INK, muted: MUTED, accent: ACCENT, serif } = await palette();
  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: bg,
          backgroundImage: `radial-gradient(ellipse 70% 90% at 85% 10%, ${glow} 0%, ${bg} 70%)`,
          fontFamily: 'Inter',
        }}
      >
        {/* Portrait, bottom-right, bleeding off the edge. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={portrait} width={556} height={640} alt="" style={{ position: 'absolute', right: -20, bottom: -40 }} />

        {/* Left: identity, then the page. */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 720, padding: '56px 0 52px 64px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>Boda Madhukar Reddy</div>
            <div style={{ display: 'flex', marginTop: 6, fontSize: 26, color: MUTED }}>
              <span style={{ color: ACCENT, fontWeight: 600 }}>Senior Software Engineer</span>
              <span style={{ margin: '0 12px' }}>·</span>
              <span>AI Architect</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                paddingBottom: 6,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: ACCENT,
                borderBottom: `1px solid ${alpha(ACCENT, 0.5)}`,
              }}
            >
              {eyebrow}
            </div>
            <div style={{ display: 'flex', marginTop: 18, fontFamily: serif ? 'Instrument Serif' : 'Inter', fontSize: serif ? titleSize * 1.18 : titleSize, fontWeight: serif ? 400 : 800, lineHeight: 1.04, letterSpacing: '-0.01em', color: INK }}>
              {title}
            </div>
            {meta && <div style={{ display: 'flex', marginTop: 14, fontSize: 22, color: MUTED }}>{meta}</div>}
          </div>

          {stats ? (
            <div style={{ display: 'flex', gap: 36 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: INK }}>{s.value}</span>
                  <span style={{ fontSize: 18, color: MUTED }}>{s.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 22, color: MUTED }}>dhucar.in</div>
          )}
          {stack && (
            <div style={{ display: 'flex', gap: 10, marginTop: -18 }}>
              {stack.map((t) => (
                <span
                  key={t}
                  style={{ display: 'flex', padding: '5px 14px', borderRadius: 6, fontSize: 18, color: INK, border: `1px solid ${alpha(INK, 0.18)}` }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, immutable' },
  });
}
