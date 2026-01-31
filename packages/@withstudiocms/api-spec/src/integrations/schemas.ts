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

/**
 * Request schema for a DbStudio query.
 *
 * @remarks
 * This schema defines the structure of a database query request sent to the DbStudio integration.
 * It includes properties such as the type of request, a unique identifier, and the SQL statement to be executed.
 */
export const DbStudioQueryRequest = Schema.Struct({
	type: Schema.Literal('query'),
	id: Schema.Number,
	statement: Schema.String,
});

/**
 * Request schema for a DbStudio transaction.
 *
 * @remarks
 * This schema defines the structure of a database transaction request sent to the DbStudio integration.
 * It includes properties such as the type of request, a unique identifier, and an array of SQL statements to be executed in the transaction.
 */
export const DbStudioTransactionRequest = Schema.Struct({
	type: Schema.Literal('transaction'),
	id: Schema.Number,
	statements: Schema.Array(Schema.String),
});

/**
 * Payload schema for DbStudio query and transaction requests.
 *
 * @remarks
 * This schema is a union of the DbStudio query and transaction request schemas,
 * allowing for either type of request to be sent as the payload.
 */
export const DbStudioQueryRequestPayload = Schema.Union(
	DbStudioQueryRequest.annotations({
		title: 'DbStudioQueryRequest',
		description: 'Schema for a database query request.',
	}),
	DbStudioTransactionRequest.annotations({
		title: 'DbStudioTransactionRequest',
		description: 'Schema for a database transaction request.',
	})
);

/**
 * Enum representing the possible column types in a database result set.
 */
export enum ColumnType {
	TEXT = 1,
	INTEGER = 2,
	REAL = 3,
	BLOB = 4,
}

/**
 * Schema for a single header in a DbStudio SQL result set.
 *
 * @remarks
 * This schema defines the structure of a header in the result set returned by a database query.
 * It includes properties such as the column name, display name, original type, and inferred type.
 */
const DbStudioSQLResultHeader = Schema.Struct({
	name: Schema.String,
	displayName: Schema.String,
	originalType: Schema.NullOr(Schema.String),
	type: Schema.optional(Schema.Enums(ColumnType)),
});

/**
 * Schema for the result of a DbStudio SQL query.
 *
 * @remarks
 * This schema defines the structure of the result returned by a database query executed via the DbStudio integration.
 * It includes properties such as the rows of data, headers, statistics about the query execution, and an optional last insert row ID.
 */
export const DbStudioSQLResult = Schema.Struct({
	rows: Schema.Array(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
	headers: Schema.Array(DbStudioSQLResultHeader),
	stat: Schema.Struct({
		rowsAffected: Schema.Number,
		rowsRead: Schema.NullOr(Schema.Number),
		rowsWritten: Schema.NullOr(Schema.Number),
		queryDurationMs: Schema.NullOr(Schema.Number),
	}),
	lastInsertRowid: Schema.optional(Schema.Number),
});

/**
 * Response schema for DbStudio query and transaction requests.
 *
 * @remarks
 * This schema is a union of the DbStudio query and transaction response schemas,
 * allowing for either type of response to be returned based on the request type.
 */
export const DbStudioQueryResponsePayload = Schema.Union(
	Schema.Struct({
		type: Schema.Literal('query'),
		id: Schema.Number,
		data: DbStudioSQLResult,
	}).annotations({
		title: 'DbStudioQueryResponse',
		description: 'Schema for a database query response.',
	}),
	Schema.Struct({
		type: Schema.Literal('transaction'),
		id: Schema.Number,
		data: Schema.Array(DbStudioSQLResult),
	}).annotations({
		title: 'DbStudioTransactionResponse',
		description: 'Schema for a database transaction response.',
	})
);

/**
 * Error response schema for DbStudio query and transaction requests.
 *
 * @remarks
 * This schema defines the structure of error responses returned for DbStudio query and transaction requests.
 * It includes properties such as the request type, unique identifier, and an error message.
 */
export const DbStudioQueryError = Schema.Struct({
	type: Schema.Literal('query', 'transaction'),
	id: Schema.Number,
	error: Schema.String,
}).annotations({
	title: 'DbStudioQueryError',
	description: 'Schema for a database query or transaction error response.',
});
