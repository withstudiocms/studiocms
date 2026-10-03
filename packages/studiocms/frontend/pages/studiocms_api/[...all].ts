import config from 'studiocms:config';
import { HttpApiBuilder, HttpServerResponse } from '@effect/platform';
import type { Api } from '@effect/platform/HttpApi';
import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import type { APIRoute } from 'astro';
import { Layer } from 'effect';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import * as Scalar from 'effectify/scalar';
import { AuthAPILive } from './_handlers/auth/index.js';
import { DashboardAPILive } from './_handlers/dashboard/index.js';
import { IntegrationsAPILive } from './_handlers/integration/index.js';
import { RestAPILive } from './_handlers/rest-api/index.js';
import { SDKAPILive } from './_handlers/sdk.js';

/**
 * Scalar layer for the StudioCMS API Documentation route, providing a custom header and linking to the documentation for all API specifications.
 */
const DocsRouteLive = Scalar.layer({
	title: 'StudioCMS API Documentation',
	description:
		'The Documentation for the StudioCMS API, including all available endpoints and specifications.',
	customHeader: {
		title: {
			text: 'StudioCMS API Documentation',
			link: '/studiocms_api/docs',
		},
		nav: [
			{
				text: 'StudioCMS Website',
				link: 'https://studiocms.dev',
			},
			{
				text: 'GitHub Repository',
				link: 'https://github.com/withstudiocms/studiocms',
			},
			{
				text: 'StudioCMS Discord',
				link: 'https://chat.studiocms.dev',
			},
		],
	},
	path: '/studiocms_api/docs',
	sources: [
		{
			title: 'Auth API',
			httpApi: StudioCMSAuthApi,
		},
		{
			title: 'Dashboard API',
			httpApi: StudioCMSDashboardApiSpec,
		},
		{
			title: 'Integrations API',
			httpApi: StudioCMSIntegrationsApiSpec,
		},
		{
			title: 'REST API v1',
			httpApi: StudioCMSRestApiV1Spec,
		},
		{
			title: 'SDK API',
			httpApi: StudioCMSSDKApiSpec,
		},
	],
});

/**
 * Catch-All Route Layer - Provides a catch-all route that redirects any unmatched requests to a 404 page.
 *
 * This is needed to ensure that any requests that are passed to the Effect API handlers return an Astro 404 page instead of the Effect 404 response.
 */
export const CatchAllGroup = HttpApiBuilder.Router.use((router) =>
	router.get('*', HttpServerResponse.redirect('/404'))
);

/**
 * Collection of API handlers for the new Effect HttpApi handlers
 */
const APICollection = Layer.mergeAll(
	AuthAPILive,
	IntegrationsAPILive,
	RestAPILive,
	SDKAPILive,
	DashboardAPILive,
	CatchAllGroup
);

/**
 * Combined API Layer - Combines the API handlers with the documentation route if enabled in the configuration.
 *
 * If the API documentation is enabled, it merges the DocsRouteLive layer with the APICollection layer to serve both the API endpoints and the documentation. If the documentation is disabled, it only serves the API endpoints.
 */
const APILive: Layer.Layer<Api, never, never> = config.features.api.apiDocs
	? Layer.merge(DocsRouteLive, APICollection)
	: APICollection;

/**
 * Astro API Route - Converts the combined Effect API stack into an Astro route for serving the API documentation and endpoints.
 */
export const ALL: APIRoute = HttpApiToAstroRoute(APILive);
