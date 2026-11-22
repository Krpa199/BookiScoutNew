import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker/self-hosting (DigitalOcean Droplet).
  // Vercel ignores this and uses its own build pipeline — safe to keep on both.
  output: 'standalone',

  // Tracing: keep `.next/cache` excluded but INCLUDE src/content/articles/ —
  // ISR (since 2026-05-31) renders long-tail pages on-demand at runtime, which
  // requires reading the JSON files in src/content/articles/. Excluding them
  // breaks dynamicParams=true rendering with 404s.
  outputFileTracingExcludes: {
    '*': ['.next/cache/**'],
  },
  // Force-include the article JSONs in the standalone output bundle so the
  // running container can fs.readFileSync them for on-demand ISR.
  outputFileTracingIncludes: {
    '/[locale]/guides/[slug]': ['./src/content/articles/**'],
    '/[locale]/destinations/[slug]': ['./src/content/articles/**'],
  },

  // Image optimization
  images: {
    // Optimized images are cached on disk (.next/cache/images) and sent with this
    // max-age. Default is 60s, which made every visit re-optimize and kept Cloudflare
    // from caching. Source images never change under the same URL, so 30 days is safe.
    minimumCacheTTL: 2592000,
    // Drop the 2048/3840 defaults: no layout is wider than 1920px and the huge
    // variants were the slowest to generate on the 2-vCPU server.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
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
      // Cache all HTML pages aggressively on CDN (stale-while-revalidate for seamless deploys)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
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
