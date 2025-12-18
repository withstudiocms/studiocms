type ContextBodyResolveUrl = {
	action: 'resolveUrl';
	identifier: `storage-file://${string}`;
};

type ContextBodyPublicUrl = {
	action: 'publicUrl';
	key: string;
};

type ContextBodyUpload = {
	action: 'upload';
	key: string;
	contentType: string;
};

type ContextBodyDelete = {
	action: 'delete';
	key: string;
};

type ContextBodyRename = {
	action: 'rename';
	key: string;
	newKey: string;
};

type ContextBodyCleanup = {
	action: 'cleanup';
};

type ContextBodyMappings = {
	action: 'mappings';
};

type ContextBodyTest = {
	action: 'test';
};

type ContextBodyList = {
	action: 'list';
	prefix?: string;
	key?: string;
};

type ContextBodyDownload = {
	action: 'download';
	key: string;
};

/**
 * Context JSON Body type.
 *
 * This type defines the possible structures for the JSON body
 * in the context of storage manager API requests.
 */
export type ContextJsonBody =
	| ContextBodyResolveUrl
	| ContextBodyPublicUrl
	| ContextBodyUpload
	| ContextBodyDelete
	| ContextBodyRename
	| ContextBodyCleanup
	| ContextBodyMappings
	| ContextBodyTest
	| ContextBodyList
	| ContextBodyDownload;

/**
 * Authorization Type.
 *
 * This type defines the possible authorization types
 * that can be used in storage manager API requests.
 */
export type AuthorizationType = 'locals' | 'headers';

/**
 * Parsed Context type.
 *
 * This type defines the structure of a parsed context,
 * including methods to retrieve JSON body, array buffer,
 * get headers, and check authorization.
 */
export type ParsedContext = {
	getJson: () => Promise<ContextJsonBody>;
	getArrayBuffer: () => Promise<ArrayBuffer>;
	getHeader: (name: string) => string | null;
	isAuthorized: (type?: AuthorizationType) => Promise<boolean>;
};

/**
 * URL Metadata interface.
 *
 * This interface defines the structure for URL metadata,
 * including the URL itself, permanence status, and optional expiration time.
 */
export interface UrlMetadata {
	url: string;
	isPermanent: boolean;
	expiresAt?: number; // Unix timestamp in ms
}

/**
 * URL Mapping interface.
 *
 * This interface extends UrlMetadata to include additional properties
 * for identifying and tracking URL mappings.
 */
export interface UrlMapping extends UrlMetadata {
	identifier: `storage-file://${string}`;
	createdAt: number;
	updatedAt: number;
}

/**
 * Context Handler type.
 *
 * This type defines a function that takes a ParsedContext
 * and returns a Promise resolving to an object containing data and status.
 */
export type ContextHandler = (context: ParsedContext) => Promise<{ data: unknown; status: number }>;

/**
 * Context Handler Function type.
 *
 * This type defines a function that takes a context of type C
 * and returns a Promise resolving to a response of type R.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export type ContextHandlerFn<C, R> = (context: C) => Promise<R>;

/**
 * Context Driver Definition interface.
 *
 * This interface defines the structure and methods for a context driver,
 * including parsing the context, building responses, and handling endpoints.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export interface ContextDriverDefinition<C, R> {
	parseContext: (context: C) => ParsedContext;
	buildResponse: <D>(opts: { data: D; status: number }) => R;
	handleEndpoint(contextHandler: ContextHandler): ContextHandlerFn<C, R>;
}

/**
 * Storage API Endpoint Function type.
 *
 * This type defines a function that takes a context of type C
 * and returns a Promise resolving to a response of type R.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export type StorageAPIEndpointFn<C, R> = (context: C) => Promise<R>;

/**
 * Storage API Builder Definition interface.
 *
 * This interface defines the structure and methods for building storage API endpoints,
 * including handling POST and PUT requests.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export interface StorageApiBuilderDefinition<C, R> {
	driver: ContextDriverDefinition<C, R>;
	urlMappingService: UrlMappingServiceDefinition;
	getPOST(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
	getPUT(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
}

/**
 * URL Mapping Database Definition interface.
 *
 * This interface defines the structure and methods for the URL Mapping Database,
 * which is responsible for storing and retrieving URL mappings.
 */
export interface UrlMappingDatabaseDefinition {
	get(identifier: `storage-file://${string}`): Promise<UrlMapping | null>;
	set(mapping: UrlMapping): Promise<void>;
	delete(identifier: `storage-file://${string}`): Promise<void>;
	cleanup(): Promise<number>; // Returns count of deleted entries
	getAll(): Promise<UrlMapping[]>;
}

/**
 * URL Mapping Service Definition interface.
 *
 * This interface defines the structure and methods for the URL Mapping Service,
 * which manages the mapping between storage file identifiers and their corresponding URLs.
 */
export interface UrlMappingServiceDefinition {
	database: UrlMappingDatabaseDefinition;
	resolve(
		identifier: `storage-file://${string}`,
		refreshCallback: (key: string) => Promise<UrlMetadata>
	): Promise<UrlMetadata>;
	register(identifier: `storage-file://${string}`, metadata: UrlMetadata): Promise<void>;
	delete(identifier: `storage-file://${string}`): Promise<void>;
	cleanup(): Promise<number>;
	getAll(): Promise<UrlMetadata[]>;
	createIdentifier(key: string): `storage-file://${string}`;
}

/**
 * API Core Definition interface.
 *
 * This interface defines the structure and methods for the core API of the Storage Manager,
 * including access to the context driver, URL mapping service, and storage API builder.
 *
 * @typeParam C - The context type.
 * @typeParam R - The response type.
 */
export interface APICoreDefinition<C, R> {
	driver: ContextDriverDefinition<C, R>;
	urlMappingService: UrlMappingServiceDefinition;
	storageDriver: StorageApiBuilderDefinition<C, R>;
	getDriver(): ContextDriverDefinition<C, R>;
	getUrlMappingService(): UrlMappingServiceDefinition;
	getStorageDriver(): StorageApiBuilderDefinition<C, R>;
	getPOST(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
	getPUT(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
}
