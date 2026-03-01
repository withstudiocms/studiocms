import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSRestApiV1Spec } from '@withstudiocms/api-spec';
import { Effect, Layer } from 'effect';
import { RestAPIAuthorizationLive } from '../../../_middleware/restApi.ts';

/**
 * REST API v1 Secure Handler
 *
 * This handler is responsible for managing all secure endpoints of the REST API v1. It includes endpoints for creating, updating, deleting, and retrieving categories, folders, pages, settings, tags, and users. Each endpoint is currently implemented as a placeholder that returns an empty Effect, but can be expanded in the future to include actual logic for interacting with the database and performing the necessary operations.
 */
export const RestApiSecureHandler = HttpApiBuilder.group(
	StudioCMSRestApiV1Spec,
	'restV1',
	(handlers) =>
		handlers
			// Category Endpoints
			.handle('createCategory', () => Effect.void)
			.handle('deleteCategory', () => Effect.void)
			.handle('updateCategory', () => Effect.void)
			.handle('getCategories', () => Effect.void)
			.handle('getCategory', () => Effect.void)

			// Folder Endpoints
			.handle('createFolder', () => Effect.void)
			.handle('deleteFolder', () => Effect.void)
			.handle('updateFolder', () => Effect.void)
			.handle('getFolders', () => Effect.void)
			.handle('getFolder', () => Effect.void)

			// Page Endpoints
			.handle('createPage', () => Effect.void)
			.handle('deletePage', () => Effect.void)
			.handle('updatePage', () => Effect.void)
			.handle('getPages', () => Effect.void)
			.handle('getPage', () => Effect.void)
			.handle('getPageHistory', () => Effect.void)
			.handle('getPageHistoryEntry', () => Effect.void)

			// Settings Endpoints
			.handle('getSettings', () => Effect.void)
			.handle('updateSettings', () => Effect.void)

			// Tag Endpoints
			.handle('createTag', () => Effect.void)
			.handle('deleteTag', () => Effect.void)
			.handle('updateTag', () => Effect.void)
			.handle('getTags', () => Effect.void)
			.handle('getTag', () => Effect.void)

			// User Endpoints
			.handle('createUser', () => Effect.void)
			.handle('deleteUser', () => Effect.void)
			.handle('updateUser', () => Effect.void)
			.handle('getUsers', () => Effect.void)
			.handle('getUser', () => Effect.void)
).pipe(Layer.provide(RestAPIAuthorizationLive));
