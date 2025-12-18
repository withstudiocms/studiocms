export type AuthorizationType = 'locals' | 'headers';

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

export type ParsedContext = {
	getJson: () => Promise<ContextJsonBody>;
	getArrayBuffer: () => Promise<ArrayBuffer>;
	getHeader: (name: string) => string | null;
	isAuthorized: (type?: AuthorizationType) => Promise<boolean>;
};

export interface UrlMetadata {
	url: string;
	isPermanent: boolean;
	expiresAt?: number; // Unix timestamp in ms
}

export interface UrlMapping extends UrlMetadata {
	identifier: `storage-file://${string}`;
	createdAt: number;
	updatedAt: number;
}

export type ContextHandler = (context: ParsedContext) => Promise<{ data: unknown; status: number }>;

export type ContextHandlerFn<C, R> = (context: C) => Promise<R>;

export interface ContextDriverDefinition<C, R> {
	parseContext: (context: C) => ParsedContext;
	buildResponse: <D>(opts: { data: D; status: number }) => R;
	handleEndpoint(contextHandler: ContextHandler): ContextHandlerFn<C, R>;
}

export type StorageAPIEndpointFn<C, R> = (context: C) => Promise<R>;

export interface StorageApiBuilderDefinition<C, R> {
	driver: ContextDriverDefinition<C, R>;
	urlMappingService: UrlMappingServiceDefinition;
	getPOST(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
	getPUT(type?: AuthorizationType): StorageAPIEndpointFn<C, R>;
}

export interface UrlMappingDatabaseDefinition {
	get(identifier: `storage-file://${string}`): Promise<UrlMapping | null>;
	set(mapping: UrlMapping): Promise<void>;
	delete(identifier: `storage-file://${string}`): Promise<void>;
	cleanup(): Promise<number>; // Returns count of deleted entries
	getAll(): Promise<UrlMapping[]>;
}

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
