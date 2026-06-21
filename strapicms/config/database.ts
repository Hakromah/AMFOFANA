import path from 'path';
import type { Core } from '@strapi/strapi';

type ClientKind = 'postgres' | 'sqlite';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'postgres') as ClientKind;

  // 1. SQLite Environment Engine Branch
  if (client === 'sqlite') {
    // Cast to 'any' to stop TypeScript from cross-validating with Postgres properties
    const sqliteConnection: any = {
      filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
    };

    return {
      connection: {
        client: 'sqlite',
        connection: sqliteConnection,
        useNullAsDefault: true,
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }

  // 2. PostgreSQL Engine Branch (Local and Deployed VPS/Render)
  const databaseUrl = env('DATABASE_URL');
  let connectionDetails: any;

  if (databaseUrl) {
    // Cloud Hosting (Render/Hetzner URL Connection String Approach)
    connectionDetails = {
      connectionString: databaseUrl,
      ssl: env.bool('DATABASE_SSL', true) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
      },
    };
  } else {
    // Local / VPS Standard Discrete Field Fallback Connection
    connectionDetails = {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'strapi'),
      user: env('DATABASE_USERNAME', 'strapi'),
      password: env('DATABASE_PASSWORD', 'strapi'),
      schema: env('DATABASE_SCHEMA', 'public'),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
      },
    };
  }

  return {
    connection: {
      client: 'postgres',
      connection: connectionDetails,
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};

export default config;




// import path from 'path';
// import type { Core } from '@strapi/strapi';

// const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
//   const client = env('DATABASE_CLIENT', 'postgres'); // Default to postgres for production

//   const connections = {
//     postgres: {
//       connection: {
//         // Render provides a DATABASE_URL. If it exists, Strapi uses it.
//         connectionString: env('DATABASE_URL'),
//         host: env('DATABASE_HOST', 'localhost'),
//         port: env.int('DATABASE_PORT', 5432),
//         database: env('DATABASE_NAME', 'strapi'),
//         user: env('DATABASE_USERNAME', 'strapi'),
//         password: env('DATABASE_PASSWORD', 'strapi'),
//         schema: env('DATABASE_SCHEMA', 'public'),
//         // CRITICAL FOR RENDER: SSL must be enabled in production
//         ssl: env.bool('DATABASE_SSL', true) && {
//           rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
//         },
//       },
//       pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
//     },
//     sqlite: {
//       connection: {
//         filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
//       },
//       useNullAsDefault: true,
//     },
//   };

//   return {
//     connection: {
//       client,
//       ...connections[client],
//       acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
//     },
//   };
// };

// export default config;
