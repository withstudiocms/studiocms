import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import * as Scalar from 'effectify/scalar';
import { SDKAPILive } from './_handlers/sdk.js';

// TODO: Make this a user config option
const withDocs: boolean = true; // Toggle this to enable/disable the documentation route

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
			// TODO: Implement handlers
			title: 'Auth API',
			httpApi: StudioCMSAuthApi,
		},
		{
			// TODO: Implement handlers
			title: 'Dashboard API',
			httpApi: StudioCMSDashboardApiSpec,
		},
		{
			title: 'Integrations API',
			httpApi: StudioCMSIntegrationsApiSpec,
		},
		{
			// TODO: Implement handlers
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
 * Collection of API handlers for the new Effect HttpApi handlers
 */
const APICollection = SDKAPILive;

/**
 * Combined API Layer - Merges the documentation route layer with the main API collection layer.
 *
 * This layer combines the API documentation route (if enabled) with the main API handlers, allowing both to be served from the same Astro route. The documentation route provides a user-friendly interface for exploring the API specifications, while the API collection layer includes all the actual API endpoints.
 *
 * The `withDocs` flag can be toggled to enable or disable the documentation route as needed, allowing for flexibility in different deployment scenarios (e.g., development vs. production).
 *
 * @returns A Layer that includes both the documentation route and the API handlers, or just the API handlers if documentation is disabled.
 */
const APILive = withDocs ? Layer.merge(DocsRouteLive, APICollection) : APICollection;

/**
 * Astro API Route - Converts the combined Effect API stack into an Astro route for serving the API documentation and endpoints.
 */
export const ALL = HttpApiToAstroRoute(APILive);
