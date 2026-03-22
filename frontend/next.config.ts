/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname:"ambitious-bubble-123f76e3bb.media.strapiapp.com"
      }
    ],
  },
};

export default nextConfig;

