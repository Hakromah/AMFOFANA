/**
 * \`auth-cookie\` middleware
 */

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Wait for the auth controllers to finish handling the request
    await next();

    // If this is a successful local login request
    if (
      ctx.request.url === '/api/auth/local' &&
      ctx.request.method === 'POST' &&
      ctx.status === 200 &&
      ctx.body?.jwt &&
      ctx.body?.user
    ) {
      const jwt = ctx.body.jwt;
      const user = ctx.body.user;

      // The login response body sanitizes custom User fields
      // Query the database to ensure we get the user's actual schoolRole
      const fullUser = (await strapi.entityService.findOne(
        'plugin::users-permissions.user' as any,
        user.id
      )) as any;

      const role = fullUser?.schoolRole || 'STUDENT';

      // Attach the HTTP-only JWT token
      ctx.cookies.set('accessToken', jwt, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        path: '/',
        sameSite: 'none',
      });

      // Attach the readable role string for the frontend Next.js router
      ctx.cookies.set('userRole', role, {
        httpOnly: false,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'none',
      });
    }
  };
};
