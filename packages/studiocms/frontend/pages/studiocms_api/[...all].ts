import {
	StudioCMSAuthApi,
	StudioCMSDashboardApiSpec,
	StudioCMSIntegrationsApiSpec,
	StudioCMSRestApiV1Spec,
	StudioCMSSDKApiSpec,
} from '@withstudiocms/api-spec';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import * as Scalar from 'effectify/scalar';

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
 * Combined API Stack - Combines all API specifications and Scalar Docs layer into a single Effect Layer for serving the API documentation and endpoints.
 *
 * This layer merges the documentation route with all API handlers, allowing for a unified API experience where users can access both the documentation and the live API endpoints seamlessly.
 */
// const APILive = Layer.merge(DocsRouteLive, APILiveHandlers);

/**
 * Astro API Route - Converts the combined Effect API stack into an Astro route for serving the API documentation and endpoints.
 */
export const ALL = HttpApiToAstroRoute(DocsRouteLive);
