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
        // Strapi local dev server
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol:"https",
        hostname:"outgoing-fruit-84aa9644f7.media.strapiapp.com",
      }
    ],
  },
};

export default nextConfig;

