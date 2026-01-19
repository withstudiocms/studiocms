import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config, ConfigProvider, Effect, Redacted } from 'effect';
import type {
	AuthorizationType,
	ContextDriverDefinition,
	StorageAPIEndpointFn,
	StorageApiBuilderDefinition,
	UrlMappingServiceDefinition,
	UrlMetadata,
} from 'studiocms/storage-manager/definitions';

const s3SafeNameRegex = /^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/;

/**
 * S3 Client Builder Effect
 *
 * Builds and configures the S3 client using environment variables.
 */
const s3ClientBuilder = Effect.gen(function* () {
	// Extract configuration values from environment variables
	const [
		// With default values for optional config
		region,
		endpoint,
		forcePathStyle,
		provider,

		// Redacted config values
		accessKeyId,
		secretAccessKey,

		// Required config values
		bucketName,
		publicEndpoint,
	] = yield* Effect.all([
		Config.withDefault(Config.string('REGION'), 'auto'),
		Config.withDefault(Config.string('ENDPOINT'), undefined),
		Config.withDefault(Config.boolean('FORCE_PATH_STYLE'), false),
		Config.withDefault(Config.string('PROVIDER'), 'Unknown'),
		Config.redacted('ACCESS_KEY_ID'),
		Config.redacted('SECRET_ACCESS_KEY'),
		Config.string('BUCKET_NAME'),
		Config.string('PUBLIC_ENDPOINT'),
	]);

	// Create S3 client Credentials configuration
	const credentials = {
		accessKeyId: Redacted.value(accessKeyId),
		secretAccessKey: Redacted.value(secretAccessKey),
	};

	// Initialize S3 Client
	const client = new S3Client({
		region,
		endpoint,
		credentials,
		forcePathStyle,
	});

	return {
		client,
		bucketName,
		publicEndpoint,
		provider,
	};
}).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv().pipe(ConfigProvider.nested('CMS_S3'))));

/**
 * S3 Client Interface
 *
 * Represents the S3 client along with bucket and endpoint information.
 */
type S3ClientInterface = {
	client: S3Client;
	bucketName: string;
	publicEndpoint: string;
	provider: string;
};

// Singleton S3 Client Instance
let s3ClientInterface: S3ClientInterface | null = null;

/**
 * Get S3 Client
 *
 * Returns the singleton S3 client instance, initializing it if necessary.
 */
const getS3Client = async (): Promise<S3ClientInterface> => {
	if (!s3ClientInterface) {
		s3ClientInterface = await Effect.runPromise(s3ClientBuilder);
	}
	return s3ClientInterface;
};

/**
 * Generate URL Metadata
 *
 * Generates URL metadata for a given S3 object key, either as a permanent public URL
 * or a presigned URL with expiration.
 */
const generateUrlMetadata = ({ publicEndpoint, bucketName, client }: S3ClientInterface) =>
	async function generateUrlMetadata(key: string): Promise<UrlMetadata> {
		// If public endpoint is configured, return permanent public URL
		if (publicEndpoint) {
			const publicUrl = publicEndpoint.endsWith('/')
				? `${publicEndpoint}${key}`
				: `${publicEndpoint}/${key}`;
			return { url: publicUrl, isPermanent: true };
		}

		// Fallback to presigned URL (7 days max)
		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: key,
		});
		const SevenDaysInSeconds = 7 * 24 * 60 * 60;
		const inSevenDays = new Date();

		// Generate presigned URL
		const url = await getSignedUrl(client, command, { expiresIn: SevenDaysInSeconds });
		inSevenDays.setSeconds(inSevenDays.getSeconds() + SevenDaysInSeconds);

		// Return URL metadata with expiration
		return { url, isPermanent: false, expiresAt: inSevenDays.getTime() };
	};

/**
 * S3-compatible storage API service that provides endpoints for managing files in S3-compatible storage.
 *
 * Implements the StorageApiBuilderDefinition interface to handle various storage operations including
 * file uploads, downloads, deletions, renames, and URL mapping management.
 *
 * @template C - The context type used by the underlying driver
 * @template R - The response type returned by the driver
 *
 * @remarks
 * This service supports the following operations through POST requests:
 * - `resolveUrl`: Resolve a file identifier to its URL metadata
 * - `publicUrl`: Generate and register a public URL for a file
 * - `upload`: Generate a presigned URL for uploading files
 * - `list`: List objects in the bucket with optional prefix filtering
 * - `delete`: Delete a file and its URL mapping
 * - `rename`: Rename/move a file and update its URL mapping
 * - `download`: Generate a presigned URL for downloading files
 * - `cleanup`: Remove expired URL mappings
 * - `mappings`: Retrieve all URL mappings (debugging)
 * - `test`: Test the S3 connection
 *
 * PUT requests are used for direct file uploads with the file key specified in the `x-storage-key` header.
 *
 * Most operations require authorization except for `resolveUrl` and `publicUrl` which are publicly accessible.
 *
 * @example
 * ```typescript
 * const service = new S3ApiService(driver, urlMappingService);
 * const postEndpoint = service.getPOST('locals');
 * const putEndpoint = service.getPUT('locals');
 * ```
 */
export default class S3ApiService<C, R> implements StorageApiBuilderDefinition<C, R> {
	driver;
	urlMappingService;

	constructor(
		driver: ContextDriverDefinition<C, R>,
		urlMappingService: UrlMappingServiceDefinition
	) {
		this.driver = driver;
		this.urlMappingService = urlMappingService;
	}

	getPOST(type?: AuthorizationType): StorageAPIEndpointFn<C, R> {
		return this.driver.handleEndpoint(async ({ getJson, isAuthorized }) => {
			const jsonBody = await getJson();

			const s3Interface = await getS3Client();

			const { client: s3Client, bucketName: BUCKET_NAME, provider } = s3Interface;

			const metaGenerator = generateUrlMetadata(s3Interface);

			// Cases when authorization is required
			const authRequiredActions = [
				'upload',
				'delete',
				'rename',
				'cleanup',
				'mappings',
				'test',
				'list',
			];
			if (authRequiredActions.includes(jsonBody.action) && !isAuthorized(type)) {
				return { data: { error: 'Unauthorized' }, status: 401 };
			}

			switch (jsonBody.action) {
				case 'resolveUrl': {
					const metadata = await this.urlMappingService.resolve(jsonBody.identifier, metaGenerator);
					return { data: metadata, status: 200 };
				}

				case 'publicUrl': {
					const metadata = await metaGenerator(jsonBody.key);

					// Optionally register the mapping
					const mappingIdentifier = this.urlMappingService.createIdentifier(jsonBody.key);
					await this.urlMappingService.register(mappingIdentifier, metadata);

					return {
						data: {
							...metadata,
							identifier: mappingIdentifier,
						},
						status: 200,
					};
				}

				case 'upload': {
					if (!s3SafeNameRegex.test(jsonBody.key)) {
						return {
							data: {
								error: 'Invalid key format. Only alphanumeric characters and . _ - / are allowed.',
							},
							status: 400,
						};
					}

					// Generate presigned URL for upload
					const command = new PutObjectCommand({
						Bucket: BUCKET_NAME,
						Key: jsonBody.key,
						ContentType: jsonBody.contentType,
					});
					const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
					return { data: { url, key: jsonBody.key }, status: 200 };
				}

				case 'list': {
					const command = new ListObjectsV2Command({
						Bucket: BUCKET_NAME,
						Prefix: jsonBody.prefix || jsonBody.key || '',
					});
					const response = await s3Client.send(command);
					const files =
						response.Contents?.map((item) => ({
							key: item.Key,
							size: item.Size,
							lastModified: item.LastModified,
						})) || [];
					return { data: { files }, status: 200 };
				}

				case 'delete': {
					const command = new DeleteObjectCommand({
						Bucket: BUCKET_NAME,
						Key: jsonBody.key,
					});
					await s3Client.send(command);

					// Also delete from URL mapping
					const mappingIdentifier = this.urlMappingService.createIdentifier(jsonBody.key);
					await this.urlMappingService.delete(mappingIdentifier);

					return { data: { success: true }, status: 200 };
				}

				case 'rename': {
					if (!jsonBody.newKey) {
						return { data: { error: 'newKey is required for rename action' }, status: 400 };
					}
					if (!s3SafeNameRegex.test(jsonBody.newKey)) {
						return {
							data: {
								error: 'Invalid key format. Only alphanumeric characters and . _ - / are allowed.',
							},
							status: 400,
						};
					}

					// Copy the object to the new key
					const copyCommand = new CopyObjectCommand({
						Bucket: BUCKET_NAME,
						CopySource: `${BUCKET_NAME}/${jsonBody.key}`,
						Key: jsonBody.newKey,
					});
					await s3Client.send(copyCommand);

					// Delete the old object
					const deleteCommand = new DeleteObjectCommand({
						Bucket: BUCKET_NAME,
						Key: jsonBody.key,
					});
					await s3Client.send(deleteCommand);

					// Update URL mappings
					const oldMappingIdentifier = this.urlMappingService.createIdentifier(jsonBody.key);
					await this.urlMappingService.delete(oldMappingIdentifier);

					// Create new mapping for the renamed file
					const newMappingIdentifier = this.urlMappingService.createIdentifier(jsonBody.newKey);
					const urlMetadata = await metaGenerator(jsonBody.newKey);
					await this.urlMappingService.register(newMappingIdentifier, urlMetadata);

					return { data: { success: true, newKey: jsonBody.newKey }, status: 200 };
				}

				case 'download': {
					// Generate presigned URL for download
					const command = new GetObjectCommand({
						Bucket: BUCKET_NAME,
						Key: jsonBody.key,
					});
					const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
					return { data: { url }, status: 200 };
				}

				case 'cleanup': {
					// Clean up expired mappings
					const deletedCount = await this.urlMappingService.cleanup();
					return { data: { deletedCount }, status: 200 };
				}

				case 'mappings': {
					// Get all mappings (for debugging)
					const mappings = await this.urlMappingService.getAll();
					return { data: { mappings }, status: 200 };
				}

				case 'test': {
					// Test connection to verify configuration
					try {
						const command = new ListObjectsV2Command({
							Bucket: BUCKET_NAME,
							MaxKeys: 1,
						});
						await s3Client.send(command);
						return {
							data: {
								success: true,
								message: 'Successfully connected to S3-compatible storage',
								provider,
							},
							status: 200,
						};
					} catch (error) {
						return {
							data: {
								success: false,
								error: error instanceof Error ? error.message : 'Connection failed',
							},
							status: 500,
						};
					}
				}

				default:
					return { data: { error: 'Invalid action' }, status: 400 };
			}
		});
	}

	getPUT(type?: AuthorizationType): StorageAPIEndpointFn<C, R> {
		return this.driver.handleEndpoint(async ({ getArrayBuffer, getHeader, isAuthorized }) => {
			if (!isAuthorized(type)) {
				return { data: { error: 'Unauthorized' }, status: 401 };
			}

			const s3Interface = await getS3Client();

			const { client: s3Client, bucketName: BUCKET_NAME } = s3Interface;

			try {
				const contentType = getHeader('Content-Type') || 'application/octet-stream';
				const key = getHeader('x-storage-key');

				if (!key) {
					return { data: { error: 'Missing x-storage-key header' }, status: 400 };
				}

				const fileData = await getArrayBuffer();

				// Upload to S3
				const command = new PutObjectCommand({
					Bucket: BUCKET_NAME,
					Key: key,
					Body: new Uint8Array(fileData),
					ContentType: contentType,
				});

				await s3Client.send(command);

				console.log(`Successfully uploaded file to S3: ${key}`);

				return { data: { message: 'File uploaded successfully', key }, status: 200 };
			} catch (error) {
				console.error('S3 PUT Error:', error);
				return { data: { error: (error as Error).message }, status: 500 };
			}
		});
	}
}
