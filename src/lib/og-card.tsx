import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared 1200×630 social card: glassy panel over the site's gradient wallpaper. */
export function ogCard({ eyebrow, title, meta }: { eyebrow: string; title: string; meta: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 56,
          backgroundColor: '#0a0a0c',
          backgroundImage:
            'radial-gradient(circle at 12% 18%, #0a84ff 0%, transparent 45%), radial-gradient(circle at 88% 12%, #bf5af2 0%, transparent 42%), radial-gradient(circle at 80% 95%, #ff9f0a 0%, transparent 40%), radial-gradient(circle at 20% 100%, #32ade6 0%, transparent 40%)',
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
              <div
                style={{
                  display: 'flex',
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0a84ff',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                MR
              </div>
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
