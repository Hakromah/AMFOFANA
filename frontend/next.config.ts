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
      // {
      //   protocol:"https",
      //   // hostname:"outgoing-fruit-84aa9644f7.media.strapiapp.com",
      //      hostname:"reliable-sparkle-c20c5a5fa1.media.strapiapp.com"

      // }
    ],
  },
};

export default nextConfig;

