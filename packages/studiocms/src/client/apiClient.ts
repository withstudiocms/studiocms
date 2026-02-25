import { site } from 'astro:config/client';
import { FetchHttpClient, HttpApiClient } from '@effect/platform';
import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import * as Effect from 'effect/Effect';

// Get the base URL from the Astro client config, or default to localhost if not set.
const baseUrl = site || 'http://localhost:4321';

console.log(`API Client initialized with base URL: ${baseUrl}`);

/**
 * Auth Client - A client for the StudioCMS Authentication API, allowing for interactions with the authentication endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const authClient = HttpApiClient.make(StudioCMSAuthApi, {
	baseUrl,
}).pipe(Effect.provide(FetchHttpClient.layer));

/**
 * Dashboard Client - A client for the StudioCMS Dashboard API, allowing for interactions with the dashboard endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const dashboardClient = HttpApiClient.make(StudioCMSDashboardApiSpec, {
	baseUrl,
}).pipe(Effect.provide(FetchHttpClient.layer));

/**
 * Integrations Client - A client for the StudioCMS Integrations API, allowing for interactions with the integration endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const integrationsClient = HttpApiClient.make(StudioCMSIntegrationsApiSpec, {
	baseUrl,
}).pipe(Effect.provide(FetchHttpClient.layer));

/**
 * REST Client - A client for the StudioCMS REST API v1, allowing for interactions with the REST endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const restClient = HttpApiClient.make(StudioCMSRestApiV1Spec, {
	baseUrl,
}).pipe(Effect.provide(FetchHttpClient.layer));

/**
 * SDK Client - A client for the StudioCMS SDK API, allowing for interactions with the SDK endpoints defined in the API specification. This client is configured with the base URL and uses the FetchHttpClient for making requests to the backend.
 */
export const sdkClient = HttpApiClient.make(StudioCMSSDKApiSpec, {
	baseUrl,
}).pipe(Effect.provide(FetchHttpClient.layer));

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
