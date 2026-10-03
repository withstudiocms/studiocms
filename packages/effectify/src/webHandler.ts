import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { HttpApiBuilder } from '@effect/platform';
import type { PathInput } from '@effect/platform/HttpRouter';
import * as HttpServerRequest from '@effect/platform/HttpServerRequest';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import type * as Layer from 'effect/Layer';

/**
 * Custom error class for handling errors in the web handler, providing context about the request and the error.
 */
export class WebHandlerError extends Data.TaggedError('effectify/webHandler.WebHandlerError')<{
	request: HttpServerRequest.HttpServerRequest;
	description?: string;
	cause?: unknown;
}> {}

/**
 * Utility function to process the URL from the HttpServerRequest, taking into account headers like 'host' and 'x-forwarded-proto'.
 */
export const processUrl = Effect.fn('effectify/webHandler.processUrl')(
	(headers: Headers, req: HttpServerRequest.HttpServerRequest) =>
		Effect.try({
			try: () => {
				const origin = new URL(req.originalUrl);
				const host = headers.get('host') ?? origin.host;
				const protocol = headers.get('x-forwarded-proto')
					? `${headers.get('x-forwarded-proto')}:`
					: origin.protocol;
				const url =
					req.url.startsWith('http://') || req.url.startsWith('https://')
						? req.url
						: `${protocol}//${host}${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
				return url;
			},
			catch: (cause) =>
				new WebHandlerError({
					request: req,
					description: 'An error occurred while processing the request URL',
					cause,
				}),
		})
);

/**
 * Converts an HttpServerRequest to a standard Web Request.
 */
export const ServerRequestToRequest = Effect.fn('effectify/webHandler.ServerRequestToRequest')(
	function* (originalRequest: HttpServerRequest.HttpServerRequest) {
		const headers = new Headers(originalRequest.headers as Record<string, string>);
		const url = yield* processUrl(headers, originalRequest); // Using the processUrl function to construct the URL

		let bodyInit: BodyInit | null = null;
		if (originalRequest.method !== 'GET' && originalRequest.method !== 'HEAD') {
			const arrayBuffer = yield* originalRequest.arrayBuffer;
			if (arrayBuffer.byteLength > 0) {
				bodyInit = new Uint8Array(arrayBuffer);
			} else {
				bodyInit = new Uint8Array(0);
			}
		}

		const request = new Request(url, {
			method: originalRequest.method,
			headers,
			redirect: 'manual',
			body: bodyInit,
		});

		return request;
	},
	Effect.catchTag('RequestError', (error) => new WebHandlerError(error))
);

/**
 * Converts a standard Web Response to an HttpServerResponse.
 */
export const ResponseToHttpServerResponse = Effect.fn(
	'effectify/webHandler.ResponseToHttpServerResponse'
)(function* (webResponse: Response) {
	const responseHeaders: Record<string, string> = {};
	webResponse.headers.forEach((value: string, key: string) => {
		responseHeaders[key] = value;
	});

	const stream = webResponse.body ? Readable.fromWeb(webResponse.body as WebReadableStream) : null;

	return HttpServerResponse.raw(stream).pipe(
		HttpServerResponse.setStatus(webResponse.status),
		HttpServerResponse.setHeaders(responseHeaders)
	);
});

/**
 * Converts a web handler function to an Effect HttpServerRequest handler, wrapping it in error handling to catch any issues that arise during processing.
 *
 * @param handler - The web handler function that takes a Request and returns a Promise of a Response.
 * @param originalRequest - The original HttpServerRequest that is being processed.
 * @returns An Effect that represents the asynchronous processing of the request and response, with error handling.
 */
export const tryWebHandler = Effect.fn('effectify/webHandler.tryWebHandler')(
	(
		handler: (request: Request) => Promise<Response>,
		request: HttpServerRequest.HttpServerRequest
	) =>
		ServerRequestToRequest(request).pipe(
			Effect.flatMap((webHandlerRequest) =>
				Effect.tryPromise({
					try: () => handler(webHandlerRequest),
					catch: (cause) =>
						new WebHandlerError({
							request,
							description: 'An error occurred while processing the request',
							cause,
						}),
				})
			)
		)
);

/**
 * Converts a web handler function to an Effect HttpServerRequest handler.
 */
export const webHandlerToEffectHttpHandler = Effect.fn(
	'effectify/webHandler.webHandlerToEffectHttpHandler'
)(function* (handler: (request: Request) => Promise<Response>) {
	const originalRequest = yield* HttpServerRequest.HttpServerRequest;
	const webResponse = yield* tryWebHandler(handler, originalRequest);
	return yield* ResponseToHttpServerResponse(webResponse);
});

/**
 * Utility function to convert a Effect-based web handler into a format that can be used with the HttpApiBuilder from Effect. This allows you to define your web handlers using Effect and then easily integrate them into an HTTP API.
 *
 * @param path - The path for the HTTP route that this handler will be associated with.
 * @param handler - The Effect-based web handler function that processes the request and returns a response.
 * @returns A Layer that can be used to add this handler to an HttpApiBuilder router.
 */
export const EffectHttpHandlerToHttpApi = (
	path: PathInput,
	handler: Effect.Effect<
		HttpServerResponse.HttpServerResponse,
		WebHandlerError,
		HttpServerRequest.HttpServerRequest
	>
): Layer.Layer<never, never, never> =>
	HttpApiBuilder.Router.use((router) => router.all(path, handler));
