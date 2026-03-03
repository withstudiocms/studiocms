import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';

/**
 * Shared database error handlers for the Dashboard API. These handlers convert common database-related errors into consistent DashboardAPIError responses, allowing for cleaner and more maintainable error handling across all endpoints that interact with the database.
 */
export const sharedDBErrors = {
	DBCallbackFailure: () => new DashboardAPIError({ error: 'Database callback failed' }),
	DBClientInitializationError: () =>
		new DashboardAPIError({ error: 'Database client initialization failed' }),
	NotFoundError: () => new DashboardAPIError({ error: 'Resource not found' }),
	QueryError: () => new DashboardAPIError({ error: 'Database query failed' }),
	QueryParseError: () => new DashboardAPIError({ error: 'Database query parsing failed' }),
	SDKInitializationError: () => new DashboardAPIError({ error: 'SDK initialization failed' }),
};

/**
 * Shared notification error handlers for the Dashboard API. These handlers convert common notification-related errors into consistent DashboardAPIError responses, allowing for cleaner and more maintainable error handling across all endpoints that involve sending notifications.
 */
export const sharedNotifierErrors = {
	ConfigError: () =>
		new DashboardAPIError({ error: 'Configuration error during notification sending' }),
	SMTPError: () => new DashboardAPIError({ error: 'SMTP error during notification sending' }),
	UnknownException: () =>
		new DashboardAPIError({ error: 'An unknown error occurred during notification sending' }),
};

/**
 * Shared page collection error handlers for the Dashboard API. These handlers convert common errors that can occur during the collection of pages for operations like category deletion into consistent DashboardAPIError responses, allowing for cleaner and more maintainable error handling in endpoints that involve complex data collection and manipulation.
 */
export const sharedPageCollectionErrors = {
	ParseError: () => new DashboardAPIError({ error: 'Failed to parse data during page collection' }),
	FolderTreeError: () =>
		new DashboardAPIError({
			error: 'Failed to retrieve folder tree during page collection',
		}),
	CollectorError: () =>
		new DashboardAPIError({
			error: 'Failed to collect necessary data during page collection',
		}),
	PaginateError: () =>
		new DashboardAPIError({ error: 'Failed to paginate data during page collection' }),
};
