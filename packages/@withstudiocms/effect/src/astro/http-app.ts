import {
	type HttpApi,
	HttpApiBuilder,
	HttpApp,
	HttpLayerRouter,
	type HttpMiddleware,
	type HttpRouter,
	HttpServer,
	type HttpServerError,
	type HttpServerRequest,
	type HttpServerResponse,
} from '@effect/platform';
import type { APIContext, APIRoute } from 'astro';
import { Context, type Effect, Layer, type Scope } from 'effect';

/**
 * A Context Reference for Astro API route locals.
 */
export class AstroAPIContext extends Context.Reference<AstroAPIContext>()('AstroAPIContext', {
	defaultValue: () => ({}) as APIContext,
}) {}

/**
 * Builds an Astro API route handler from a given request handler function.
 *
 * @param handler - The request handler function.
 * @returns An Astro APIRoute handler.
 */
function buildEndpoint(
	handler: (request: Request, context?: Context.Context<never> | undefined) => Promise<Response>
): APIRoute {
	return async (context) => {
		// Create a Context with the current Astro API context
		const localsContext = Context.make(AstroAPIContext, context);
		try {
			// Handle the request using the generated handler
			return await handler(context.request, localsContext);
		} catch (error) {
			// Log and rethrow any errors that occur during request handling
			console.error('Error handling request:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	};
}

const sigtermDisposers: Array<() => Promise<void>> = [];
let sigtermBound = false;

/**
 * Registers a disposer function to be called on SIGTERM.
 *
 * @param dispose - The disposer function to register.
 */
const registerSigterm = (dispose: () => Promise<void>) => {
	sigtermDisposers.push(dispose);
	if (sigtermBound || typeof process === 'undefined' || !process?.on) return;
	sigtermBound = true;
	process.on('SIGTERM', () => {
		Promise.allSettled(sigtermDisposers.map((d) => d())).then((results) => {
			const hasError = results.some((r) => r.status === 'rejected');
			process.exit(hasError ? 1 : 0);
		});
	});
};

/**
 * Converts an Effect HttpApp into an Astro API route handler.
 *
 * @param app - The Effect HttpApp to convert.
 * @param middleware - Optional middleware to apply to the HttpApp.
 * @returns An Astro APIRoute handler.
 */
export const HttpAppToAstroRoute = <E>(
	app: HttpApp.Default<E>,
	middleware?: HttpMiddleware.HttpMiddleware | undefined
): APIRoute => {
	// Create a web handler from the HttpApp and middleware
	const handler = HttpApp.toWebHandler(app, middleware);

	// Return the Astro API route handler
	return buildEndpoint(handler);
};

/**
 * Converts an Effect HttpApi Layer into an Astro API route handler.
 *
 * @param layer - The Effect HttpApi Layer to convert.
 * @param options - Optional configuration options.
 * @returns An Astro APIRoute handler.
 */
export const HttpApiToAstroRoute = <LA, LE>(
	layer: Layer.Layer<LA | HttpApi.Api, LE>,
	options?: {
		readonly middleware?: (
			httpApp: HttpApp.Default
		) => HttpApp.Default<
			never,
			HttpApi.Api | HttpApiBuilder.Router | HttpRouter.HttpRouter.DefaultServices
		>;
		readonly memoMap?: Layer.MemoMap;
	}
): APIRoute => {
	const { handler, dispose } = HttpApiBuilder.toWebHandler(
		Layer.merge(layer, HttpServer.layerContext),
		options
	);
	registerSigterm(dispose);
	return buildEndpoint(handler);
};

/**
 * Converts an Effect HttpLayerRouter Layer into an Astro API route handler.
 *
 * @param appLayer - The Effect HttpLayerRouter Layer to convert.
 * @param options - Optional configuration options.
 * @returns An Astro APIRoute handler.
 */
export const HttpLayerRouterToAstroRoute = <
	A,
	E,
	R extends
		| HttpLayerRouter.HttpRouter
		// biome-ignore lint/suspicious/noExplicitAny: Required for generic constraint
		| HttpLayerRouter.Request<'Requires', any>
		// biome-ignore lint/suspicious/noExplicitAny: Required for generic constraint
		| HttpLayerRouter.Request<'GlobalRequires', any>
		// biome-ignore lint/suspicious/noExplicitAny: Required for generic constraint
		| HttpLayerRouter.Request<'Error', any>
		// biome-ignore lint/suspicious/noExplicitAny: Required for generic constraint
		| HttpLayerRouter.Request<'GlobalError', any>,
	HE,
	HR = Exclude<
		HttpLayerRouter.Request.Only<'Requires', R> | HttpLayerRouter.Request.Only<'GlobalRequires', R>,
		A
	>,
>(
	appLayer: Layer.Layer<A, E, R>,
	options?: {
		readonly memoMap?: Layer.MemoMap | undefined;
		readonly routerConfig?: Partial<HttpLayerRouter.FindMyWay.RouterConfig> | undefined;
		readonly disableLogger?: boolean | undefined;
		/**
		 * Middleware to apply to the HTTP server.
		 *
		 * NOTE: This middleware is applied to the entire HTTP server chain,
		 * including the sending of the response. This means that modifications
		 * to the response **WILL NOT** be reflected in the final response sent to the
		 * client.
		 *
		 * Use HttpLayerRouter.middleware to create middleware that can modify the
		 * response.
		 */
		readonly middleware?: (
			effect: Effect.Effect<
				HttpServerResponse.HttpServerResponse,
				| HttpLayerRouter.Request.Only<'Error', R>
				| HttpLayerRouter.Request.Only<'GlobalError', R>
				| HttpServerError.RouteNotFound,
				| Scope.Scope
				| HttpServerRequest.HttpServerRequest
				| HttpLayerRouter.Request.Only<'Requires', R>
				| HttpLayerRouter.Request.Only<'GlobalRequires', R>
			>
		) => Effect.Effect<HttpServerResponse.HttpServerResponse, HE, HR>;
	}
): APIRoute => {
	const { dispose, handler } = HttpLayerRouter.toWebHandler(appLayer, options);
	registerSigterm(dispose);
	// biome-ignore lint/suspicious/noExplicitAny: needed to satisfy handler type
	return buildEndpoint(handler as any);
};
