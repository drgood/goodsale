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
        // Production subdomains (e.g., gshop.goodsale.online)
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
        // Localhost subdomains (e.g., gshop.localhost:3000)
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

  // Images from external sources
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

  // Ensure static assets load correctly
  assetPrefix: '/',
};

module.exports = nextConfig;
