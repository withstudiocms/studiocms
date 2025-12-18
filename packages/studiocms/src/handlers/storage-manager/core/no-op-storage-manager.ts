import type {
	AuthorizationType,
	ContextDriverDefinition,
	StorageAPIEndpointFn,
	StorageApiBuilderDefinition,
	UrlMappingServiceDefinition,
} from '../definitions.js';

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
