/**
 * \`cookie-to-bearer\` middleware
 * 
 * Automatically reads the HTTP-only \`accessToken\` cookie and injects it as
 * an \`Authorization: Bearer <token>\` header so that Strapi's native users-permissions
 * plugin can authenticate requests matching the Spring Boot architecture.
 */

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const token = ctx.cookies.get('accessToken');
    
    if (token && !ctx.request.header.authorization) {
      ctx.request.header.authorization = `Bearer ${token}`;
    }
    
    await next();
  };
};
