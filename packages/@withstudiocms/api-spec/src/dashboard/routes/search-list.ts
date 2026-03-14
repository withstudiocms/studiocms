import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import { SearchListResponse } from '../schemas.js';

/**
 * Search List Endpoint
 *
 * This endpoint allows retrieving a list of searchable items in the StudioCMS dashboard.
 *
 * @remarks
 * - This endpoint requires user authentication via Astro Locals Context.
 * - Users must be logged into the current StudioCMS instance with appropriate permissions to use this endpoint.
 */
export const searchListGet = HttpApiEndpoint.get('searchList', '/search-list')
	.annotate(Title, 'Search List')
	.annotate(Summary, 'Retrieve a list of searchable pages or folders in the StudioCMS dashboard')
	.annotate(
		Description,
		'Retrieves a list of searchable pages or folders in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in/contextlocals) and requires users to be logged into the current StudioCMS instance with appropriate permissions.'
	)
	.middleware(AstroLocalsMiddleware)
	.addSuccess(SearchListResponse)
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
