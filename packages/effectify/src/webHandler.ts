import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { HttpServerRequest } from '@effect/platform';
import { RequestError } from '@effect/platform/HttpServerError';
import * as HttpServerResponse from '@effect/platform/HttpServerResponse';
import { Effect } from 'effect';

/**
 * Utility function to process the URL from the HttpServerRequest, taking into account headers like 'host' and 'x-forwarded-proto'.
 */
const processUrl = Effect.fn((headers: Headers, req: HttpServerRequest.HttpServerRequest) =>
	Effect.try({
		try: () => {
			const origin = new URL(req.originalUrl);
			const host = headers.get('host') ?? origin.host;
			const protocol = headers.get('x-forwarded-proto') ?? origin.protocol;
			const url =
				req.url.startsWith('http://') || req.url.startsWith('https://')
					? req.url
					: `${protocol}//${host}${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
			return url;
		},
		catch: (cause) =>
			new RequestError({
				request: req,
				reason: 'Decode',
				description: 'An error occurred while processing the request URL',
				cause,
			}),
	})
);

/**
 * Converts an HttpServerRequest to a standard Web Request.
 */
export const ServerRequestToRequest = Effect.fn(function* (
	req: HttpServerRequest.HttpServerRequest
) {
	const headers = new Headers(req.headers as Record<string, string>);
	const url = yield* processUrl(headers, req); // Using the processUrl function to construct the URL

	let bodyInit: BodyInit | null = null;
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		const arrayBuffer = yield* req.arrayBuffer;
		if (arrayBuffer.byteLength > 0) {
			bodyInit = new Uint8Array(arrayBuffer);
		} else {
			bodyInit = new Uint8Array(0);
		}
	}

	const request = new Request(url, {
		method: req.method,
		headers,
		redirect: 'manual',
		body: bodyInit,
	});

	return request;
});

/**
 * Converts a standard Web Response to an HttpServerResponse.
 */
export const ResponseToHttpServerResponse = Effect.fn(function* (webResponse: Response) {
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
 * Converts a web handler function to an Effect HttpServerRequest handler.
 */
export const webHandlerToEffectHttpHandler = Effect.fn(function* (
	handler: (request: Request) => Promise<Response>
) {
	const req = yield* HttpServerRequest.HttpServerRequest;
	const request = yield* ServerRequestToRequest(req);
	const webResponse = yield* Effect.tryPromise({
		try: () => handler(request),
		catch: (cause) =>
			new RequestError({
				request: req,
				reason: 'Transport',
				description: 'An error occurred while processing the request',
				cause,
			}),
	});
	return yield* ResponseToHttpServerResponse(webResponse);
});
