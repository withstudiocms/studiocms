import { HttpApiEndpoint } from '@effect/platform';
import { Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { SearchListResponse } from '../schemas.js';

/**
 * Search List Endpoint
 *
 * This endpoint allows retrieving a list of searchable items in the StudioCMS dashboard.
 *
 * @remarks
 * This handler does not require authentication and is used to retrieve a list of searchable items (pages and folders) in the StudioCMS dashboard and via the API.
 * It is designed to provide a limited set of information for each item, including id, name, slug (for pages), type (folder or page), and isDraft status (for pages).
 * This information lacks enough metadata to do harm and is intended for use in search functionality within the dashboard.
 */
export const searchListGet = HttpApiEndpoint.get('searchList', '/search-list')
	.annotate(Title, 'Search List')
	.annotate(Summary, 'Retrieve a list of searchable pages or folders in the StudioCMS dashboard')
	.middleware(AstroLocalsMiddleware)
	.addSuccess(SearchListResponse)
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
