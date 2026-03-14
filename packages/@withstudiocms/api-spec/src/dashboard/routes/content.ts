import { HttpApiEndpoint } from '@effect/platform';
import { Description, Summary, Title } from '@effect/platform/OpenApi';
import { AstroLocalsMiddleware } from '../../astro-context.js';
import { DashboardAPIError } from '../errors.js';
import {
	CreateFolderPayload,
	CreatePagePayload,
	contentDiffPostPayload,
	DeleteFolderPayload,
	DeletePagePayload,
	successResponseSchema,
	UpdateFolderPayload,
	UpdatePagePayload,
} from '../schemas.js';

/**
 * Endpoint to create a new content page in the StudioCMS dashboard.
 */
export const contentPagePost = HttpApiEndpoint.post('createPage', '/content/page')
	.annotate(Title, 'Create new Page')
	.annotate(Summary, 'Create a new content page in the dashboard')
	.annotate(
		Description,
		'Creates a new content page with the provided details in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreatePagePayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to update an existing content page in the StudioCMS dashboard.
 */
export const contentPagePatch = HttpApiEndpoint.patch('updatePage', '/content/page')
	.annotate(Title, 'Update existing Page')
	.annotate(Summary, 'Update an existing content page in the dashboard')
	.annotate(
		Description,
		'Updates an existing content page with the provided details in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UpdatePagePayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 404 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to delete an existing content page in the StudioCMS dashboard.
 */
export const contentPageDelete = HttpApiEndpoint.del('deletePage', '/content/page')
	.annotate(Title, 'Delete existing Page')
	.annotate(Summary, 'Delete an existing content page in the dashboard')
	.annotate(
		Description,
		'Deletes an existing content page in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(DeletePagePayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 404 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to create a new folder in the StudioCMS dashboard.
 */
export const contentFolderPost = HttpApiEndpoint.post('createFolder', '/content/folder')
	.annotate(Title, 'Create new Folder')
	.annotate(Summary, 'Create a new folder in the dashboard')
	.annotate(
		Description,
		'Creates a new folder with the provided details in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(CreateFolderPayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to update an existing folder in the StudioCMS dashboard.
 */
export const contentFolderPatch = HttpApiEndpoint.patch('updateFolder', '/content/folder')
	.annotate(Title, 'Update existing Folder')
	.annotate(Summary, 'Update an existing folder in the dashboard')
	.annotate(
		Description,
		'Updates an existing folder with the provided details in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(UpdateFolderPayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to delete an existing folder in the StudioCMS dashboard.
 */
export const contentFolderDelete = HttpApiEndpoint.del('deleteFolder', '/content/folder')
	.annotate(Title, 'Delete existing Folder')
	.annotate(Summary, 'Delete an existing folder in the dashboard')
	.annotate(
		Description,
		'Deletes an existing folder in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(DeleteFolderPayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });

/**
 * Endpoint to revert content to a previous diff state in the StudioCMS dashboard.
 */
export const contentDiffPost = HttpApiEndpoint.post('revertToDiff', '/content/diff')
	.annotate(Title, 'Revert to Content Diff')
	.annotate(Summary, 'Revert content to a previous diff state')
	.annotate(
		Description,
		'Reverts content to a previous diff state in the StudioCMS dashboard.\n\n> [!note]\n> This endpoint verifies User authentication using [Astro Locals Context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals) and requires users to be logged into the current StudioCMS instance.'
	)
	.middleware(AstroLocalsMiddleware)
	.setPayload(contentDiffPostPayload)
	.addSuccess(successResponseSchema, { status: 200 })
	.addError(DashboardAPIError, { status: 400 })
	.addError(DashboardAPIError, { status: 403 })
	.addError(DashboardAPIError, { status: 500 });
