import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { DashboardAPIError } from '@withstudiocms/api-spec/dashboard';
import { Effect } from 'effect';
import { sharedDBErrors, sharedPageCollectionErrors } from './_shared.js';

/**
 * Check if the Dashboard API is enabled in the route configuration.
 */
const dashboardAPIEnabled = routeConfig.dashboardAPIEnabled;

/**
 * Search Item type for the searchList handler response.
 */
type SearchItem = {
	id: string;
	name: string;
	slug?: string;
	type: 'folder' | 'page';
	isDraft?: boolean | null;
};

/**
 * Search Handlers for the Dashboard API
 */
export const SearchHandlers = HttpApiBuilder.group(
	StudioCMSDashboardApiSpec,
	'search',
	(handlers) =>
		handlers.handle('searchList', () =>
			!dashboardAPIEnabled
				? Effect.fail(new DashboardAPIError({ error: 'Dashboard API is disabled' }))
				: SDKCore.pipe(
						Effect.flatMap((sdk) =>
							Effect.all([
								sdk.GET.folderList().pipe(
									Effect.map((f) => f.map(({ id, name }) => ({ id, name, type: 'folder' })))
								),
								sdk.GET.pages(true).pipe(
									Effect.map((res) =>
										res.map(({ id, title, slug, draft }) => ({
											id,
											name: title,
											slug,
											isDraft: draft,
											type: 'page',
										}))
									)
								),
							])
						),
						Effect.flatMap(([folders, pages]) =>
							Effect.succeed([...folders, ...pages] as SearchItem[])
						),
						Effect.catchTags({
							...sharedDBErrors,
							...sharedPageCollectionErrors,
						})
					)
		)
);
