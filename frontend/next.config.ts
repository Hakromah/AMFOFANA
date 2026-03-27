/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        // Strapi local dev server (localhost)
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        // Strapi network server (LAN IP)
        protocol: 'http',
        hostname: '192.168.1.137',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol:"https",
        hostname:"engaging-heart-abbd6e0d5c.media.strapiapp.com"
      }
    ],
  },
};

export default nextConfig;

