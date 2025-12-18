import type {
	APICoreDefinition,
	AuthorizationType,
	ContextDriverDefinition,
	StorageApiBuilderDefinition,
	UrlMappingServiceDefinition,
} from '../definitions';

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
