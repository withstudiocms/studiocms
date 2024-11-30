import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware((ctx, next) => {
  if (ctx.request.method === 'POST' && ctx.url.pathname.startsWith('/_server-islands')) {
    const request = ctx.request.clone();
    request.headers.set('Cache-Control', 'max-age=86400');
    
    const newReq = new Request(request, {
      method: request.method,
    });
    
    console.log(newReq.url, newReq.headers);

    return next(newReq);
  }

  return next();
});
