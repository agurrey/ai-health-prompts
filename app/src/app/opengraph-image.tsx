import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Hormesis — Free Daily Workout';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111111',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Logo H */}
        <svg width="80" height="80" viewBox="0 0 32 32">
          <line x1="7" y1="5" x2="7" y2="27" stroke="#fafafa" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="25" y1="5" x2="25" y2="27" stroke="#fafafa" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="7" y1="19" x2="25" y2="12" stroke="#22c55e" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
            Hormesis
          </div>
          <div style={{ fontSize: 24, color: '#a3a3a3', maxWidth: 600, textAlign: 'center' }}>
            Free daily workout — no login, no paywall
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#22c55e' }}>
          by @ignakki
        </div>
      </div>
    ),
    { ...size }
  );
}
