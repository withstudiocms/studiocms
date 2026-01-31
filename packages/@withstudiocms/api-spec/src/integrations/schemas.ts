import { HttpApiSchema } from '@effect/platform';
import { Schema } from 'effect';

/**
 * Standard error response schema for the StudioCMS Integrations API.
 *
 * @remarks
 * This schema defines the structure of error responses returned by the API.
 * It includes a single property:
 * - `error`: A string message describing the error.
 */
export const IntegrationsErrorResponse = Schema.Struct({
	error: Schema.String,
});

/**
 * Standard success response schema for the StudioCMS Integrations API.
 *
 * @remarks
 * This schema defines the structure of successful responses returned by the API.
 * It includes a single property:
 * - `message`: A string message indicating success.
 */
export const IntegrationsSuccessResponse = Schema.Struct({
	message: Schema.String,
});

/**
 * Response schema for the Storage Manager POST endpoint.
 *
 * @remarks
 * This schema defines the structure of successful responses returned by the Storage Manager POST endpoint.
 * It extends the standard success response with an additional `fileId` property.
 */
export const StorageManagerPutSuccessResponse = Schema.Struct({
	...IntegrationsSuccessResponse.fields,
	key: Schema.String,
});

/**
 * Headers schema for the Storage Manager PUT endpoint.
 *
 * @remarks
 * This schema defines the required headers for the Storage Manager PUT endpoint.
 * It includes a custom header `x-storage-key` to specify the storage key for the request.
 */
export const StorageManagerPutHeaders = Schema.Struct({
	'x-storage-key': Schema.String.annotations({
		description: 'Custom header to specify the storage key for the PUT request.',
	}),
});

/**
 * Payload schema for the Storage Manager PUT endpoint.
 *
 * @remarks
 * This schema defines the payload for the Storage Manager PUT endpoint.
 * It expects an octet-stream (ArrayBuffer) as the request body.
 */
export const StorageManagerPutPayload = HttpApiSchema.Uint8Array({
	contentType: 'application/octet-stream',
}).annotations({
	description: 'Octet-stream payload (ArrayBuffer) for the storage manager PUT (upload) request.',
});

/**
 * Payload schema for the Storage Manager POST endpoint.
 *
 * @remarks
 * This schema defines the various payloads that can be sent to the Storage Manager POST endpoint.
 * It is a union of multiple action-specific schemas, each representing a different operation
 * that can be performed by the storage manager.
 */
export const StorageManagerPostRequestPayloads = Schema.Union(
	Schema.Struct({
		action: Schema.Literal('resolveUrl'),
		identifier: Schema.TemplateLiteral('storage-file://', Schema.String),
	}).annotations({
		title: 'resolveUrlPayload',
		description: 'Payload schema for the resolveUrl action.',
	}),
	Schema.Struct({
		action: Schema.Literal('publicUrl'),
		key: Schema.String,
	}).annotations({
		title: 'publicUrlPayload',
		description: 'Payload schema for the publicUrl action.',
	}),
	Schema.Struct({
		action: Schema.Literal('upload'),
		key: Schema.String,
		contentType: Schema.String,
	}).annotations({
		title: 'uploadPayload',
		description: 'Payload schema for the upload action.',
	}),
	Schema.Struct({
		action: Schema.Literal('list'),
		prefix: Schema.optional(Schema.String),
		key: Schema.optional(Schema.String),
	}).annotations({
		title: 'listPayload',
		description: 'Payload schema for the list action.',
	}),
	Schema.Struct({
		action: Schema.Literal('delete'),
		key: Schema.String,
	}).annotations({
		title: 'deletePayload',
		description: 'Payload schema for the delete action.',
	}),
	Schema.Struct({
		action: Schema.Literal('rename'),
		key: Schema.String,
		newKey: Schema.String,
	}).annotations({
		title: 'renamePayload',
		description: 'Payload schema for the rename action.',
	}),
	Schema.Struct({
		action: Schema.Literal('download'),
		key: Schema.String,
	}).annotations({
		title: 'downloadPayload',
		description: 'Payload schema for the download action.',
	}),
	Schema.Struct({
		action: Schema.Literal('cleanup'),
	}).annotations({
		title: 'cleanupPayload',
		description: 'Payload schema for the cleanup action.',
	}),
	Schema.Struct({
		action: Schema.Literal('mappings'),
	}).annotations({
		title: 'mappingsPayload',
		description: 'Payload schema for the mappings action.',
	}),
	Schema.Struct({
		action: Schema.Literal('test'),
	}).annotations({
		title: 'testPayload',
		description: 'Payload schema for the test action.',
	})
);

/**
 * Metadata schema for a Storage Manager URL.
 *
 * @remarks
 * This schema defines the metadata associated with a storage manager URL.
 * It includes properties such as the URL itself, whether it is permanent,
 * and an optional expiration timestamp.
 */
export const StorageManagerUrlMetadata = Schema.Struct({
	url: Schema.String,
	isPermanent: Schema.Boolean,
	expiresAt: Schema.optional(Schema.Number),
});

/**
 * File metadata schema for a Storage Manager file.
 *
 * @remarks
 * This schema defines the metadata associated with a storage manager file.
 * It includes properties such as the file key, size, and last modified timestamp.
 */
export const StorageManagerFile = Schema.Struct({
	key: Schema.optional(Schema.String),
	size: Schema.optional(Schema.Number),
	lastModified: Schema.optional(Schema.Date),
});

/**
 * Response schema for the Storage Manager POST endpoint.
 *
 * @remarks
 * This schema defines the various successful responses that can be returned
 * by the Storage Manager POST endpoint. It is a union of multiple response-specific
 * schemas, each representing a different type of response based on the action performed.
 */
export const StorageManagerPostResponses = Schema.Union(
	StorageManagerUrlMetadata.annotations({
		title: 'resolveUrlResponse',
		description: 'Response schema for the resolveUrl action.',
	}),
	Schema.Struct({
		...StorageManagerUrlMetadata.fields,
		identifier: Schema.TemplateLiteral('storage-file://', Schema.String),
	}).annotations({
		title: 'publicUrlResponse',
		description: 'Response schema for the publicUrl action.',
	}),
	Schema.Struct({
		url: Schema.String,
		key: Schema.String,
	}).annotations({
		title: 'uploadResponse',
		description: 'Response schema for the upload action.',
	}),
	Schema.Struct({
		files: Schema.Array(StorageManagerFile),
	}).annotations({
		title: 'listResponse',
		description: 'Response schema for the list action.',
	}),
	Schema.Struct({
		success: Schema.Boolean,
	}).annotations({
		title: 'deleteResponse',
		description: 'Response schema for the delete action.',
	}),
	Schema.Struct({
		success: Schema.Boolean,
		newKey: Schema.String,
	}).annotations({
		title: 'renameResponse',
		description: 'Response schema for the rename action.',
	}),
	Schema.Struct({
		url: Schema.String,
	}).annotations({
		title: 'downloadResponse',
		description: 'Response schema for the download action.',
	}),
	Schema.Struct({
		deletedCount: Schema.Number,
	}).annotations({
		title: 'cleanupResponse',
		description: 'Response schema for the cleanup action.',
	}),
	Schema.Struct({
		mappings: Schema.Array(StorageManagerUrlMetadata),
	}).annotations({
		title: 'mappingsResponse',
		description: 'Response schema for the mappings action.',
	}),
	Schema.Struct({
		success: Schema.Boolean,
		message: Schema.String,
		provider: Schema.String,
	}).annotations({
		title: 'testResponse',
		description: 'Response schema for the test action.',
	})
);
