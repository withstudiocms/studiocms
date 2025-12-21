import type {
	APICoreDefinition,
	AuthorizationType,
	ContextDriverDefinition,
	StorageApiBuilderDefinition,
	UrlMappingServiceDefinition,
} from '../definitions';

/**
 * API Core implementation.
 *
 * This class serves as the central core for the Storage Manager API,
 * integrating the context driver, URL mapping service, and storage API builder.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export default class APICore<C, R> implements APICoreDefinition<C, R> {
	driver: ContextDriverDefinition<C, R>;
	urlMappingService: UrlMappingServiceDefinition;
	storageDriver: StorageApiBuilderDefinition<C, R>;

	constructor(opts: {
		driver: ContextDriverDefinition<C, R>;
		urlMappingService: UrlMappingServiceDefinition;
		storageDriver: StorageApiBuilderDefinition<C, R>;
	}) {
		this.driver = opts.driver;
		this.urlMappingService = opts.urlMappingService;
		this.storageDriver = opts.storageDriver;
	}

	getDriver() {
		return this.driver;
	}

	getUrlMappingService() {
		return this.urlMappingService;
	}

	getStorageDriver() {
		return this.storageDriver;
	}

	getPOST(type?: AuthorizationType) {
		return this.storageDriver.getPOST(type);
	}

	getPUT(type?: AuthorizationType) {
		return this.storageDriver.getPUT(type);
	}
}
