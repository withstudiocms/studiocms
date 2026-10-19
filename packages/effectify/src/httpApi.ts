/** biome-ignore-all lint/complexity/noBannedTypes: Dynamic Types for API handler params */
import type { HttpServerRequest } from '@effect/platform';

/**
 * Type definition for dynamic HTTP API handler parameters, allowing for flexible path and payload types.
 */
type DynamicHttpApiHandlerParamsBase = {
	request: HttpServerRequest.HttpServerRequest;
};

/**
 * Combined type definition for dynamic HTTP API handler parameters, supporting both path parameters and payload.
 */
export type DynamicHttpApiConfig<PathParams, Payload, UrlParams> = {
	pathParamsSchema?: PathParams;
	payloadSchema?: Payload;
	urlParamsSchema?: UrlParams;
};

/**
 * Combined type definition for dynamic HTTP API handler parameters, supporting both path parameters and payload.
 */
export type DynamicHttpApiHandlerParamsBuilder<PathParams, Payload, UrlParams> =
	DynamicHttpApiHandlerParamsBase &
		(PathParams extends {}
			? {
					path: PathParams;
				}
			: {}) &
		(Payload extends {}
			? {
					payload: Payload;
				}
			: {}) &
		(UrlParams extends {}
			? {
					urlParams: UrlParams;
				}
			: {});

/**
 * Type definition for dynamic HTTP API handler parameters, allowing for flexible path and payload types.
 *
 * This type is used to define the parameters that will be passed to API handlers, with support for both path parameters and request payloads. It is built on top of the DynamicHttpApiHandlerParamsBuilder type, which conditionally includes the path and payload properties based on whether they are defined.
 */
export type DynamicHttpApiHandlerParams<
	Config extends DynamicHttpApiConfig<unknown, unknown, unknown>,
> =
	Config extends DynamicHttpApiConfig<infer PathParams, infer Payload, infer UrlParams>
		? DynamicHttpApiHandlerParamsBuilder<PathParams, Payload, UrlParams>
		: never;
