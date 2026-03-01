import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Exclude large content directories from serverless function bundles
  // Articles are only needed at build time (SSG), not at runtime
  outputFileTracingExcludes: {
    '*': ['./src/content/articles/**', '.next/cache/**'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers for AI crawlers and caching
  async headers() {
    return [
      {
        source: '/llms.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // Cache optimized images from Vercel Image Optimization API (1 year, immutable)
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache static public images (1 year, immutable)
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for backwards compatibility
  async redirects() {
    return [
      // Old guide URLs redirect to new structure
      {
        source: '/guides/:lang/:slug',
        destination: '/:lang/guides/:slug',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/blog/en/:slug',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
