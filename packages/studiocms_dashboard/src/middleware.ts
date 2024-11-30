import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.request.method === 'POST' && ctx.url.pathname.startsWith('/_server-islands')) {
    const request = ctx.request.clone();
    request.headers.set('Cache-Control', 'max-age=86400');
    
    const newReq = new Request(request, {
      method: request.method,
    });
    
    const response = await next(newReq);

    response.headers.set('Cache-Control', 'max-age=86400');

    return response;
  }

  return next();
});
