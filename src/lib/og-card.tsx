import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// The same portrait icon as the favicon and the PWA, inlined so the card needs no request.
const portrait = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/icons/icon-192.png')).toString('base64')}`;

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 social card: a glass panel on the Midnight navy, signed with the portrait. */
export function ogCard({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 56,
          backgroundColor: '#070a12',
          // One gentle gradient only: big radial glows compress badly, and WhatsApp drops
          // preview images much over ~300 KB.
          backgroundImage: 'linear-gradient(135deg, #0f1d3d 0%, #070a12 60%)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 60px',
            borderRadius: 44,
            background: 'rgba(22, 22, 26, 0.62)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                padding: '8px 22px',
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 600,
                color: '#7cc0ff',
                background: 'rgba(10,132,255,0.18)',
                border: '1px solid rgba(10,132,255,0.4)',
              }}
            >
              {eyebrow}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 70 ? 54 : title.length > 45 ? 64 : 76,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: 'white',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 26, color: 'rgba(255,255,255,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} width={56} height={56} alt="" style={{ borderRadius: 999, border: '2px solid rgba(255,255,255,0.35)' }} />
              <span style={{ color: 'white', fontWeight: 600 }}>Boda Madhukar Reddy</span>
            </div>
            <span>{meta}</span>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
