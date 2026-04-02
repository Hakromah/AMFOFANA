import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.1.137:3000', 'https://amfofana.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::cookie-to-bearer',
  'global::auth-cookie',
];

export default config;

// import type { Core } from '@strapi/strapi';

// const config: Core.Config.Middlewares = [
//   'strapi::logger',
//   'strapi::errors',
//   {
//     name: 'strapi::security',
//     config: {
//       contentSecurityPolicy: {
//         useDefaults: true,
//         directives: {
//           'connect-src': ["'self'", 'https:'],
//           // This allows the admin panel to show images from Cloudinary
//           'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
//           'media-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
//           upgradeInsecureRequests: null,
//         },
//       },
//     },
//   },
//   {
//     name: 'strapi::cors',
//     config: {
//       origin: [
//         'http://localhost:3000',
//         'http://127.0.0.1:3000',
//         'http://192.168.1.137:3000',
//         'https://amfofana.vercel.app'
//       ],
//       methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
//       headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
//       keepHeaderOnError: true,
//       credentials: true,
//     },
//   },
//   'strapi::poweredBy',
//   'strapi::query',
//   //'strapi::body',
//   {
//     name: 'strapi::body',
//     config: {
//       formLimit: '10mb',
//       jsonLimit: '10mb',
//       textLimit: '10mb',
//       formidable: {
//         maxFileSize: 10 * 1024 * 1024, // 10mb
//       },
//     },
//   },
//   'strapi::session',
//   'strapi::favicon',
//   'strapi::public',
//   'global::cookie-to-bearer',
//   'global::auth-cookie',
// ];

// export default config;

