import type {
	AuthorizationType,
	ContextDriverDefinition,
	StorageAPIEndpointFn,
	StorageApiBuilderDefinition,
	UrlMappingServiceDefinition,
} from '../definitions.js';

/**
 * A No-Op Storage Service that implements the StorageApiBuilderDefinition interface.
 *
 * This service provides placeholder implementations for storage API endpoints,
 * returning a 501 Not Implemented response for both POST and PUT requests.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export default class NoOpStorageService<C, R> implements StorageApiBuilderDefinition<C, R> {
	driver: ContextDriverDefinition<C, R>;
	urlMappingService: UrlMappingServiceDefinition;

	constructor(
		driver: ContextDriverDefinition<C, R>,
		urlMappingService: UrlMappingServiceDefinition
	) {
		this.driver = driver;
		this.urlMappingService = urlMappingService;
	}

	getPOST(_?: AuthorizationType): StorageAPIEndpointFn<C, R> {
		return this.driver.handleEndpoint(async () => {
			return { data: { error: 'noStorageConfigured' }, status: 501 };
		});
	}

	getPUT(_?: AuthorizationType): StorageAPIEndpointFn<C, R> {
		return this.driver.handleEndpoint(async () => {
			return { data: { error: 'noStorageConfigured' }, status: 501 };
		});
	}
}
