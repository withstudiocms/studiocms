import { RestAPIError } from '@withstudiocms/api-spec/rest-api';

/**
 * Shared database error handlers for the REST API. These handlers convert common database-related errors into consistent RestAPIError responses, allowing for cleaner and more maintainable error handling across all endpoints that interact with the database.
 */
export const sharedDBErrors = {
	DBCallbackFailure: () => new RestAPIError({ error: 'Database callback failed' }),
	DBClientInitializationError: () =>
		new RestAPIError({ error: 'Database client initialization failed' }),
	NotFoundError: () => new RestAPIError({ error: 'Resource not found' }),
	QueryError: () => new RestAPIError({ error: 'Database query failed' }),
	QueryParseError: () => new RestAPIError({ error: 'Database query parsing failed' }),
	SDKInitializationError: () => new RestAPIError({ error: 'SDK initialization failed' }),
};

/**
 * Shared notification error handlers for the REST API. These handlers convert common notification-related errors into consistent RestAPIError responses, allowing for cleaner and more maintainable error handling across all endpoints that involve sending notifications.
 */
export const sharedNotifierErrors = {
	ConfigError: () => new RestAPIError({ error: 'Configuration error during notification sending' }),
	SMTPError: () => new RestAPIError({ error: 'SMTP error during notification sending' }),
	UnknownException: () =>
		new RestAPIError({ error: 'An unknown error occurred during notification sending' }),
};

/**
 * Shared page collection error handlers for the REST API. These handlers convert common errors that can occur during the collection of pages for operations like category deletion into consistent RestAPIError responses, allowing for cleaner and more maintainable error handling in endpoints that involve complex data collection and manipulation.
 */
export const sharedPageCollectionErrors = {
	ParseError: () => new RestAPIError({ error: 'Failed to parse data during page collection' }),
	FolderTreeError: () =>
		new RestAPIError({
			error: 'Failed to retrieve folder tree during page collection',
		}),
	CollectorError: () =>
		new RestAPIError({
			error: 'Failed to collect necessary data during page collection',
		}),
	PaginateError: () =>
		new RestAPIError({ error: 'Failed to paginate data during page collection' }),
};
