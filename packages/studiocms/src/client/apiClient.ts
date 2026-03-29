import { site } from 'virtual:studiocms/site';
import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import type { HttpApi } from '@effect/platform/HttpApi';
import type { HttpApiGroup } from '@effect/platform/HttpApiGroup';
import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import { AuthAPIError } from '@withstudiocms/api-spec/auth';
import * as Effect from 'effect/Effect';

// Get the base URL from the Astro client config, or default to localhost if not set.
const baseUrl = site ?? 'http://localhost:4321';

/**
 * Utility function to create an HTTP API client for a given API specification. This function takes an API specification as input and returns a configured HTTP client that can be used to make requests to the corresponding API endpoints. The client is set up with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
const makeClient = <ApiId extends string, Groups extends HttpApiGroup.Any, ApiError, ApiR>(
	api: HttpApi<ApiId, Groups, ApiError, ApiR>
) => HttpApiClient.make(api, { baseUrl }).pipe(Effect.provide(FetchHttpClient.layer));

/**
 * Auth Client - A client for the StudioCMS Authentication API, allowing for interactions with the authentication endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const authClient = makeClient(StudioCMSAuthApi);

/**
 * Dashboard Client - A client for the StudioCMS Dashboard API, allowing for interactions with the dashboard endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const dashboardClient = makeClient(StudioCMSDashboardApiSpec);

/**
 * Integrations Client - A client for the StudioCMS Integrations API, allowing for interactions with the integration endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const integrationsClient = makeClient(StudioCMSIntegrationsApiSpec);

/**
 * REST Client - A client for the StudioCMS REST API v1, allowing for interactions with the REST endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const restClient = makeClient(StudioCMSRestApiV1Spec);

/**
 * SDK Client - A client for the StudioCMS SDK API, allowing for interactions with the SDK endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const sdkClient = makeClient(StudioCMSSDKApiSpec);

/**
 * A collection of all API clients for easy access throughout the application. Each client corresponds to a specific API specification, allowing for organized and modular access to the various endpoints provided by the StudioCMS backend.
 */
export const apiClients = {
	auth: authClient,
	dashboard: dashboardClient,
	integrations: integrationsClient,
	rest: restClient,
	sdk: sdkClient,
};

/**
 * A set of common error handling functions for the dashboard API. These functions take an error object as input and return a standardized error response that can be used throughout the dashboard components to display error messages to the user. Each function corresponds to a specific type of error that may occur during API interactions, allowing for consistent and centralized error handling across the application.
 */
export const dashboardSharedCatchTags = {
	AstroLocalsMissing: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	DashboardAPIError: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	HttpApiDecodeError: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	ParseError: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	RequestError: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
	ResponseError: (err: { message?: string }) =>
		Effect.succeed({
			error: err.message || 'An error occurred. Please try again.',
		}),
};

/**
 * A set of common error handling functions for the authentication API. These functions take an error object as input and return a standardized error response that can be used throughout the authentication components to display error messages to the user. Each function corresponds to a specific type of error that may occur during API interactions, allowing for consistent and centralized error handling across the application.
 */
export const sharedAuthCatchTags = {
	HttpApiDecodeError: (err?: { message?: string }) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	NotFound: () =>
		new AuthAPIError({
			error: 'An error occurred. Please try again.',
		}),
	ParseError: (err?: { message?: string }) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	RequestError: (err?: { message?: string }) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
	ResponseError: (err?: { message?: string }) =>
		new AuthAPIError({
			error: err?.message || 'An error occurred. Please try again.',
		}),
};
