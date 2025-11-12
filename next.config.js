/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pg', 'drizzle-orm'],
  // Subdomain routing
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite subdomain requests to tenant routes
        // When accessing gshop.goodsale.online/dashboard, internally route to /gshop/dashboard
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.goodsale\\.online',
            },
          ],
          destination: '/:subdomain/:path*',
        },
        // Same for localhost development (only matches *.localhost, not plain localhost)
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.+)\\.localhost',
            },
          ],
          destination: '/:subdomain/:path*',
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
