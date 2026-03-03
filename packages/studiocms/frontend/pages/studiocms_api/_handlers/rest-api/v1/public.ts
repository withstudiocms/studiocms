import { SDKCore } from 'studiocms:sdk';
import routeConfig from 'virtual:studiocms/route-config';
import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSRestApiV1Spec } from '@withstudiocms/api-spec';
import { RestAPIError } from '@withstudiocms/api-spec/rest-api';
import { Effect } from 'effect';
import { sharedDBErrors } from './_shared.js';

const restAPIEnabled = routeConfig.restAPIEnabled;

/**
 * Helper function to convert undefined values into a failed Effect with a RestAPIError. This is useful for handling cases where a resource is not found, allowing us to return a consistent error response.
 *
 * @param error The error message to use if the value is undefined.
 * @returns An Effect that fails with a RestAPIError if the value is undefined, or succeeds with the value otherwise.
 */
const undefinedMeansFail =
	(error: string) =>
	<T>(val: T | undefined): Effect.Effect<T, RestAPIError, never> =>
		val === undefined ? Effect.fail(new RestAPIError({ error })) : Effect.succeed(val);

/**
 * Helper function to convert values with a `draft` property into a failed Effect with a RestAPIError if the `draft` property is true. This is useful for handling cases where a resource is in draft state and should not be accessible through the public API, allowing us to return a consistent error response.
 *
 * @param error The error message to use if the value is a draft.
 * @returns An Effect that fails with a RestAPIError if the value has a `draft` property that is true, or succeeds with the value otherwise.
 */
const draftMeansFail =
	(error: string) =>
	<T extends { draft?: boolean }>(val: T): Effect.Effect<T, RestAPIError, never> =>
		val.draft ? Effect.fail(new RestAPIError({ error })) : Effect.succeed(val);

/**
 * REST API v1 Public Handler
 */
export const RestApiPublicHandler = HttpApiBuilder.group(
	StudioCMSRestApiV1Spec,
	'restV1Public',
	(handlers) =>
		handlers
			.handle(
				'getCategory',
				Effect.fn(({ path: { id } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.categories.byId(id)),
						Effect.flatMap(undefinedMeansFail('Category not found')),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
			.handle(
				'getCategories',
				Effect.fn(({ urlParams: { name, parent } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.categories.getAll()),
						Effect.map((categories) => {
							let filteredCategories = categories;
							if (name) {
								filteredCategories = filteredCategories.filter((category) =>
									category.name.includes(name)
								);
							}
							if (parent) {
								filteredCategories = filteredCategories.filter(
									(category) => category.parent === parent
								);
							}
							return filteredCategories;
						}),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
			.handle(
				'getFolder',
				Effect.fn(({ path: { id } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.folder(id)),
						Effect.flatMap(undefinedMeansFail('Folder not found')),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
			.handle(
				'getFolders',
				Effect.fn(({ urlParams: { name, parent } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.folderList()),
						Effect.map((folders) => {
							let filteredFolders = folders;
							if (name) {
								filteredFolders = filteredFolders.filter((folder) => folder.name.includes(name));
							}
							if (parent) {
								filteredFolders = filteredFolders.filter((folder) => folder.parent === parent);
							}
							return filteredFolders;
						}),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
			.handle(
				'getPage',
				Effect.fn(({ path: { id } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.page.byId(id)),
						Effect.flatMap(undefinedMeansFail('Page not found')),
						Effect.flatMap(draftMeansFail('Page not found')),
						Effect.catchTags({
							...sharedDBErrors,
							ParseError: () => new RestAPIError({ error: 'Failed to parse page data' }),
							CollectorError: () => new RestAPIError({ error: 'Failed to collect page data' }),
							FolderTreeError: () => new RestAPIError({ error: 'Failed to retrieve folder tree' }),
							PaginateError: () => new RestAPIError({ error: 'Failed to paginate page data' }),
						})
					);
				})
			)
			.handle(
				'getPages',
				Effect.fn(({ urlParams: { author, parentFolder, slug, title } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.pages()),
						Effect.map((pages) => {
							let filteredPages = pages;
							if (title) {
								filteredPages = filteredPages.filter((page) => page.title.includes(title));
							}
							if (slug) {
								filteredPages = filteredPages.filter((page) => page.slug.includes(slug));
							}
							if (author) {
								filteredPages = filteredPages.filter((page) => page.authorId === author);
							}
							if (parentFolder) {
								filteredPages = filteredPages.filter((page) => page.parentFolder === parentFolder);
							}
							return filteredPages;
						}),
						Effect.catchTags({
							...sharedDBErrors,
							ParseError: () => new RestAPIError({ error: 'Failed to parse pages data' }),
							CollectorError: () => new RestAPIError({ error: 'Failed to collect pages data' }),
							FolderTreeError: () => new RestAPIError({ error: 'Failed to retrieve folder tree' }),
							PaginateError: () => new RestAPIError({ error: 'Failed to paginate pages data' }),
						})
					);
				})
			)
			.handle(
				'getTag',
				Effect.fn(({ path: { id } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.tags.byId(id)),
						Effect.flatMap(undefinedMeansFail('Tag not found')),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
			.handle(
				'getTags',
				Effect.fn(({ urlParams: { name } }) => {
					if (!restAPIEnabled) {
						return Effect.fail(new RestAPIError({ error: 'Endpoint not found' }));
					}
					return SDKCore.pipe(
						Effect.flatMap((sdk) => sdk.GET.tags.getAll()),
						Effect.map((tags) => {
							let filteredTags = tags;
							if (name) {
								filteredTags = filteredTags.filter((tag) => tag.name.includes(name));
							}
							return filteredTags;
						}),
						Effect.catchTags(sharedDBErrors)
					);
				})
			)
);
