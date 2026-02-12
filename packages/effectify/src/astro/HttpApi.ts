import {
	type HttpApi,
	HttpApiBuilder,
	type HttpApp,
	type HttpRouter,
	HttpServer,
} from '@effect/platform';
import type { APIRoute } from 'astro';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import { AstroAPIContext } from './context.ts';

/**
 * Creates a new Request with decoded URL path components.
 *
 * @param request - The original Request object.
 * @returns A new Request object with decoded URL.
 *
 * @internal
 */
export const decodeRequestUrl = (request: Request): Request => {
	const url = new URL(request.url);
	url.pathname = url.pathname.replace(/%40/g, '@');

	return new Request(url, request);
};

/**
 * Builds an Astro API route handler from a given request handler function.
 *
 * @param handler - The request handler function.
 * @returns An Astro APIRoute handler.
 *
 * @internal
 */
export function buildEndpoint(
	handler: (request: Request, context?: Context.Context<never> | undefined) => Promise<Response>
): APIRoute {
	return async (context) => {
		// Create a Context with the current Astro API context
		const localsContext = Context.make(AstroAPIContext, context);
		try {
			let _request = context.request;

			// Check if the URL contains '%40' and decode it to '@'
			// This is necessary for scoped package names in URLs
			// Effect HttpApi does not automatically decode '%40' to '@'
			if (_request.url.includes('/%40')) {
				_request = decodeRequestUrl(_request);
			}

			// Update the context request with the potentially modified request
			context.request = _request;

			// Handle the request using the generated handler
			return await handler(_request, localsContext);
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
 *
 * @internal
 */
export const registerSigterm = (dispose: () => Promise<void>): void => {
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
 * Converts an Effect HttpApi Layer into an Astro API route handler.
 *
 * @param layer - The Effect HttpApi Layer to convert.
 * @param options - Optional configuration options.
 * @returns An Astro APIRoute handler.
 */
export const HttpApiToAstroRoute = <LA, LE>(
	layer: Layer.Layer<LA, LE>,
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
	// We assert the type here to allow Layers that don't actually require HttpApi.Api to be used, since the handler will only require the services it needs from the Layer. This provides more flexibility in how the Layer is constructed and allows for better composition of services.
	const safeLayer = layer as Layer.Layer<LA | HttpApi.Api, LE>;
	const { handler, dispose } = HttpApiBuilder.toWebHandler(
		Layer.merge(safeLayer, HttpServer.layerContext),
		options
	);
	registerSigterm(dispose);
	return buildEndpoint(handler);
};
