import APIServiceModule from 'studiocms:storage-manager/module';
import type { APIContext } from 'astro';
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

export const POST = getAPICore().getPOST('locals');
export const PUT = getAPICore().getPUT('locals');
