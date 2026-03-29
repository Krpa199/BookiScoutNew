import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const alt = 'Stay Check Area Review | BookiScout';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Load data
  let name = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let score = 0;
  let reviewCount = 0;
  let beaches = 0;
  let restaurants = 0;

  try {
    const filePath = path.join(process.cwd(), 'src', 'content', 'stay-check', 'en', `${slug}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      name = data.destinationName || name;
      score = data.scores?.overallScore || 0;
      reviewCount = data.reviewAnalysis?.totalReviewsAnalyzed || 0;
      beaches = data.areaData?.beaches?.length || 0;
      restaurants = data.areaData?.restaurants?.length || 0;
    }
  } catch { /* use defaults */ }

  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const year = new Date().getFullYear();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0891b2, #2dd4bf)',
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
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '8px 20px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px',
              }}
            >
              Stay Check
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>{year}</div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '60px' }}>
          {/* Left: Text */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
              Area Review
            </div>
            <div style={{ fontSize: '56px', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: '20px' }}>
              {name}, Croatia
            </div>
            <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              {reviewCount > 0 ? `Based on ${reviewCount} real guest reviews` : 'Honest area analysis from real guest reviews'}
            </div>

            {/* Stats row */}
            {(beaches > 0 || restaurants > 0) && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                {beaches > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px' }}>
                    <span style={{ fontSize: '16px' }}>🏖️</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{beaches} beaches</span>
                  </div>
                )}
                {restaurants > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px' }}>
                    <span style={{ fontSize: '16px' }}>🍽️</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>{restaurants} restaurants</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Score ring */}
          {score > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: `8px solid ${scoreColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '64px', fontWeight: 800, color: scoreColor }}>{score}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>/ 100</div>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
