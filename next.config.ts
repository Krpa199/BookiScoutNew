import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for Vercel
  output: 'standalone',

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Headers for AI crawlers
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
    ];
  },

  // Redirects for language routing
  async redirects() {
    return [
      {
        source: '/blog/:slug',
        destination: '/blog/en/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
