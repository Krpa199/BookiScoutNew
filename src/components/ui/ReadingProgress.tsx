'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-ocean-400 via-seafoam-400 to-ocean-500 transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: progress > 0 ? '0 0 8px rgba(14,165,233,0.5), 0 0 4px rgba(16,185,129,0.3)' : 'none',
        }}
      />
    </div>
  );
}
