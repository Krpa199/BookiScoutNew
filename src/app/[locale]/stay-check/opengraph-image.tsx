import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Stay Check - See What Photos Don\'t Show You | BookiScout';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 50%, #2dd4bf 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '24px',
              padding: '8px 20px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            BookiScout
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '24px',
              padding: '8px 20px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '16px',
            }}
          >
            Stay Check
          </div>
        </div>

        {/* Main title */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: '64px', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '16px' }}>
            See What Photos
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              background: 'linear-gradient(90deg, #fde68a, #ffffff)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '30px',
            }}
          >
            Don&apos;t Show You
          </div>
          <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.85)', maxWidth: '700px', lineHeight: 1.5 }}>
            Paste your accommodation link. Get an honest area review based on thousands of real guest reviews.
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['Real Reviews', 'AI-Powered', 'Free', '13 Languages'].map((text) => (
            <div
              key={text}
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '16px',
                padding: '10px 24px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
