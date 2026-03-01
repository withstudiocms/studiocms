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
