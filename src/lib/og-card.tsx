import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

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

// Midnight's warm editorial palette: paper on warm black, with the collar red.
const INK = '#ede8e1';
const MUTED = '#a1978c';
const ACCENT = '#db5760';

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
  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#110f0d',
          backgroundImage: 'radial-gradient(ellipse 70% 90% at 85% 10%, #2a221b 0%, #110f0d 70%)',
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
              <span style={{ color: ACCENT, fontWeight: 600 }}>Software Engineer</span>
              <span style={{ margin: '0 12px' }}>·</span>
              <span>Hyderabad, India</span>
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
                borderBottom: '1px solid rgba(219,87,96,0.5)',
              }}
            >
              {eyebrow}
            </div>
            <div style={{ display: 'flex', marginTop: 18, fontFamily: 'Instrument Serif', fontSize: titleSize * 1.18, fontWeight: 400, lineHeight: 1.04, letterSpacing: '-0.01em', color: INK }}>
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
                  style={{ display: 'flex', padding: '5px 14px', borderRadius: 6, fontSize: 18, color: INK, border: '1px solid rgba(237,232,225,0.18)' }}
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
