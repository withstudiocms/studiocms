import APIServiceModule from 'studiocms:storage-manager/module';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	OptionsResponse,
} from '@withstudiocms/effect';
import type { APIContext } from 'astro';
import { Effect } from 'effect';
import { type EndpointRoute, pathRouter, type SubPathRouter } from '#frontend/utils/rest-router.js';
import APICore from '#storage-manager/core/api-core';
import AstroContextDriver from '#storage-manager/core/astro-context';
import UrlMappingDatabase from '#storage-manager/core/database';
import UrlMappingService from '#storage-manager/core/url-mapping';

let apiCore: APICore<APIContext, Response>;

/**
 * Retrieves the singleton instance of the APICore.
 *
 * This function initializes the APICore instance if it hasn't been created yet,
 * setting up the necessary context driver, URL mapping service, and API service module.
 *
 * @returns The singleton APICore instance.
 */
function getAPICore() {
	if (apiCore) {
		return apiCore;
	}

	// Instantiate the Astro context driver
	const astroContextDriver = new AstroContextDriver();

	// Instantiate the database
	const database = new UrlMappingDatabase();

	// Instantiate the URL mapping service
	const urlMappingService = new UrlMappingService(database);

	// Instantiate the API service module
	const apiService = new APIServiceModule(astroContextDriver, urlMappingService);

	// Instantiate the API core
	apiCore = new APICore({
		driver: astroContextDriver,
		urlMappingService: urlMappingService,
		storageDriver: apiService,
	});

	return apiCore;
}

const storageSubRouter: SubPathRouter = {
	manager: (_id: string) =>
		createEffectAPIRoutes(
			{
				POST: (ctx) => Effect.tryPromise(async () => getAPICore().getPOST('locals')(ctx)),
				PUT: (ctx) => Effect.tryPromise(async () => getAPICore().getPUT('locals')(ctx)),
				OPTIONS: () =>
					Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'PUT', 'OPTIONS'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['POST', 'PUT', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
				},
			}
		),
};

export const storageRoute: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: {},
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
		}
	),
	id: (id: string) => pathRouter(id, storageSubRouter),
};
