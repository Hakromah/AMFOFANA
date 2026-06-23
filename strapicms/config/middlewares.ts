import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://hassanskdev.online',
        'https://www.hassanskdev.online',
        'https://api.hassanskdev.online',
        'http://localhost:3002',
        'http://localhost:1337',
        'http://localhost:3000',
        'http://127.0.0.1:1337',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3000',
        'http://192.168.1.137:3002',
        'http://192.168.1.137:1337',
        'http://192.168.1.137:3000',
        'https://amfofana.vercel.app'
      ],
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


