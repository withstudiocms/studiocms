import { site } from 'astro:config/client';
import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import type { HttpApi } from '@effect/platform/HttpApi';
import type { Client } from '@effect/platform/HttpApiClient';
import type { HttpApiGroup } from '@effect/platform/HttpApiGroup';
import type { HttpApiMiddleware } from '@effect/platform/HttpApiMiddleware';
import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import { AuthAPIError } from '@withstudiocms/api-spec/auth';
import * as Effect from 'effect/Effect';
import type { Simplify } from 'effect/Types';

// Get the base URL from the Astro client config, or default to localhost if not set.
const baseUrl = site ?? 'http://localhost:4321';

/**
 * Utility function to create an HTTP API client for a given API specification. This function takes an API specification as input and returns a configured HTTP client that can be used to make requests to the corresponding API endpoints. The client is set up with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
const makeClient = <ApiId extends string, Groups extends HttpApiGroup.Any, ApiError, ApiR>(
	api: HttpApi<ApiId, Groups, ApiError, ApiR>
): Effect.Effect<
	Simplify<Client<Groups, ApiError, never>>,
	never,
	HttpApiMiddleware.Without<ApiR | HttpApiGroup.ClientContext<Groups>>
> => HttpApiClient.make(api, { baseUrl }).pipe(Effect.provide(FetchHttpClient.layer));

// =================== Type Extraction Utilities ===================

/**
 * Extracts the resolved `Client` type from a client Effect produced by `makeClient`.
 *
 * This is the type of the value you receive when you `yield*` the client Effect
 * inside an `Effect.gen` block.
 *
 * @example
 * ```ts
 * type MyAuthClient = ClientOf<typeof authClient>;
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
export type ClientOf<T extends Effect.Effect<any, any, any>> = Effect.Effect.Success<T>;

/**
 * Extracts the error union from a client Effect produced by `makeClient`.
 *
 * @example
 * ```ts
 * type MyAuthClientErrors = ClientErrorOf<typeof authClient>;
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
export type ClientErrorOf<T extends Effect.Effect<any, any, any>> = Effect.Effect.Error<T>;

/**
 * Extracts the context requirements from a client Effect produced by `makeClient`.
 *
 * @example
 * ```ts
 * type MyAuthClientContext = ClientContextOf<typeof authClient>;
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
export type ClientContextOf<T extends Effect.Effect<any, any, any>> = Effect.Effect.Context<T>;

/**
 * Derives the resolved `Client` type directly from an `HttpApi` spec definition,
 * without needing an intermediate client Effect. Useful when writing generic utilities
 * or plugin code that operates on API specs.
 *
 * @example
 * ```ts
 * type MyAuthClient = HttpApiClientOf<typeof StudioCMSAuthApi>;
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
export type HttpApiClientOf<Api extends HttpApi<string, HttpApiGroup.Any, any, any>> =
	// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
	Api extends HttpApi<string, infer Groups, infer ApiError, any>
		? Simplify<Client<Groups, ApiError, never>>
		: never;

/**
 * Produces the full `Effect` type that `makeClient(api)` returns for a given `HttpApi` spec.
 * Use this to annotate client Effect constants with an explicit type derived from the spec,
 * avoiding a circular `typeof` reference.
 *
 * @example
 * ```ts
 * const myClient: MakeClientEffect<typeof StudioCMSAuthApi> = makeClient(StudioCMSAuthApi);
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: required for generic type constraint
export type MakeClientEffect<Api extends HttpApi<string, HttpApiGroup.Any, any, any>> =
	Api extends HttpApi<string, infer Groups, infer ApiError, infer ApiR>
		? Effect.Effect<
				Simplify<Client<Groups, ApiError, never>>,
				never,
				HttpApiMiddleware.Without<ApiR | HttpApiGroup.ClientContext<Groups>>
			>
		: never;

// =================== Concrete Client Effect Types ===================

/** The `Effect` type for the Auth API client, as returned by `makeClient`. */
export type AuthClientEffect = MakeClientEffect<typeof StudioCMSAuthApi>;
/** The `Effect` type for the Dashboard API client, as returned by `makeClient`. */
export type DashboardClientEffect = MakeClientEffect<typeof StudioCMSDashboardApiSpec>;
/** The `Effect` type for the Integrations API client, as returned by `makeClient`. */
export type IntegrationsClientEffect = MakeClientEffect<typeof StudioCMSIntegrationsApiSpec>;
/** The `Effect` type for the REST API v1 client, as returned by `makeClient`. */
export type RestClientEffect = MakeClientEffect<typeof StudioCMSRestApiV1Spec>;
/** The `Effect` type for the SDK API client, as returned by `makeClient`. */
export type SdkClientEffect = MakeClientEffect<typeof StudioCMSSDKApiSpec>;

// =================== Resolved Client Types ===================

/** The resolved Auth API client — the type you get after `yield*`-ing `authClient`. */
export type AuthClient = ClientOf<AuthClientEffect>;
/** The resolved Dashboard API client — the type you get after `yield*`-ing `dashboardClient`. */
export type DashboardClient = ClientOf<DashboardClientEffect>;
/** The resolved Integrations API client — the type you get after `yield*`-ing `integrationsClient`. */
export type IntegrationsClient = ClientOf<IntegrationsClientEffect>;
/** The resolved REST API v1 client — the type you get after `yield*`-ing `restClient`. */
export type RestClient = ClientOf<RestClientEffect>;
/** The resolved SDK API client — the type you get after `yield*`-ing `sdkClient`. */
export type SdkClient = ClientOf<SdkClientEffect>;

// =================== ApiClients Map Types ===================

/** The type of the `apiClients` collection, mapping names to their client Effects. */
export type ApiClientsMap = {
	readonly auth: AuthClientEffect;
	readonly dashboard: DashboardClientEffect;
	readonly integrations: IntegrationsClientEffect;
	readonly rest: RestClientEffect;
	readonly sdk: SdkClientEffect;
};

/**
 * The fully resolved form of `apiClients`, where each value is the resolved client
 * rather than an Effect. Useful for typing variables that hold pre-resolved clients.
 *
 * @example
 * ```ts
 * let clients: ResolvedApiClients;
 * ```
 */
export type ResolvedApiClients = {
	readonly [K in keyof ApiClientsMap]: ClientOf<ApiClientsMap[K]>;
};

// =================== Catch Tag Types ===================

/** Handler function type shared by all dashboard catch tags. */
type DashboardCatchHandler = (err: {
	message?: string;
}) => Effect.Effect<{ error: string }, never, never>;

/**
 * The type of `dashboardSharedCatchTags`, for use in typed error-handling pipelines.
 */
export type DashboardSharedCatchTags = {
	readonly AstroLocalsMissing: DashboardCatchHandler;
	readonly DashboardAPIError: DashboardCatchHandler;
	readonly HttpApiDecodeError: DashboardCatchHandler;
	readonly ParseError: DashboardCatchHandler;
	readonly RequestError: DashboardCatchHandler;
	readonly ResponseError: DashboardCatchHandler;
};

/**
 * The type of `sharedAuthCatchTags`, for use in typed error-handling pipelines.
 */
export type SharedAuthCatchTags = {
	readonly HttpApiDecodeError: (err?: { message?: string }) => AuthAPIError;
	readonly NotFound: () => AuthAPIError;
	readonly ParseError: (err?: { message?: string }) => AuthAPIError;
	readonly RequestError: (err?: { message?: string }) => AuthAPIError;
	readonly ResponseError: (err?: { message?: string }) => AuthAPIError;
};

// =================== Client Constants ===================

/**
 * Auth Client - A client for the StudioCMS Authentication API, allowing for interactions with the authentication endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const authClient: AuthClientEffect = makeClient(StudioCMSAuthApi);

/**
 * Dashboard Client - A client for the StudioCMS Dashboard API, allowing for interactions with the dashboard endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const dashboardClient: DashboardClientEffect = makeClient(StudioCMSDashboardApiSpec);

/**
 * Integrations Client - A client for the StudioCMS Integrations API, allowing for interactions with the integration endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const integrationsClient: IntegrationsClientEffect = makeClient(
	StudioCMSIntegrationsApiSpec
);

/**
 * REST Client - A client for the StudioCMS REST API v1, allowing for interactions with the REST endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const restClient: RestClientEffect = makeClient(StudioCMSRestApiV1Spec);

/**
 * SDK Client - A client for the StudioCMS SDK API, allowing for interactions with the SDK endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const sdkClient: SdkClientEffect = makeClient(StudioCMSSDKApiSpec);

/**
 * A collection of all API clients for easy access throughout the application. Each client corresponds to a specific API specification, allowing for organized and modular access to the various endpoints provided by the StudioCMS backend.
 */
export const apiClients: ApiClientsMap = {
	auth: authClient,
	dashboard: dashboardClient,
	integrations: integrationsClient,
	rest: restClient,
	sdk: sdkClient,
};

/**
 * A set of common error handling functions for the dashboard API. These functions take an error object as input and return a standardized error response that can be used throughout the dashboard components to display error messages to the user. Each function corresponds to a specific type of error that may occur during API interactions, allowing for consistent and centralized error handling across the application.
 */
export const dashboardSharedCatchTags: DashboardSharedCatchTags = {
	AstroLocalsMissing: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	DashboardAPIError: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	HttpApiDecodeError: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	ParseError: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	RequestError: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	ResponseError: (err) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
};

/**
 * A set of common error handling functions for the authentication API. These functions take an error object as input and return a standardized error response that can be used throughout the authentication components to display error messages to the user. Each function corresponds to a specific type of error that may occur during API interactions, allowing for consistent and centralized error handling across the application.
 */
export const sharedAuthCatchTags: SharedAuthCatchTags = {
	HttpApiDecodeError: (err) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	NotFound: () =>
		new AuthAPIError({
			error: 'An error occurred. Please try again.',
		}),
	ParseError: (err) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	RequestError: (err) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	ResponseError: (err) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
};
