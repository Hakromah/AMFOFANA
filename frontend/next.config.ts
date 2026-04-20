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
        protocol: "https",
        hostname: "diplomatic-splendor-66cebff67a.media.strapiapp.com"
        // https://diplomatic-splendor-66cebff67a.strapiapp.com/admin
      }
    ],
  },
};

export default nextConfig;

