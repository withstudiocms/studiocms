import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../../lib/effects/index.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

type UpdatePageData = tsPageDataSelect;
type UpdatePageContent = tsPageContentSelect;

interface CreatePageJson {
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const pages = yield* sdk.GET.pages(true);

			const searchParams = context.url.searchParams;

			const titleFilter = searchParams.get('title');
			const slugFilter = searchParams.get('slug');
			const authorFilter = searchParams.get('author');
			const draftFilter = searchParams.get('draft') === 'true';
			const publishedFilter = searchParams.get('published') === 'true';
			const parentFolderFilter = searchParams.get('parentFolder');

			let filteredPages = pages;

			if (titleFilter) {
				filteredPages = filteredPages.filter((page) => page.data.title.includes(titleFilter));
			}

			if (slugFilter) {
				filteredPages = filteredPages.filter((page) => page.data.slug.includes(slugFilter));
			}

			if (authorFilter) {
				filteredPages = filteredPages.filter((page) => page.data.authorId === authorFilter);
			}

			if (draftFilter) {
				filteredPages = filteredPages.filter((page) => page.data.draft === draftFilter);
			}

			if (publishedFilter) {
				filteredPages = filteredPages.filter((page) => !page.data.draft);
			}

			if (parentFolderFilter) {
				filteredPages = filteredPages.filter(
					(page) => page.data.parentFolder === parentFolderFilter
				);
			}

			return new Response(JSON.stringify(filteredPages), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:POST')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank, userId } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const jsonData: CreatePageJson = yield* Effect.tryPromise(() => context.request.json());

			const { data, content } = jsonData;

			if (!data) {
				return apiResponseLogger(400, 'Invalid form data, data is required');
			}

			if (!content) {
				return apiResponseLogger(400, 'Invalid form data, content is required');
			}

			if (!data.title) {
				return apiResponseLogger(400, 'Invalid form data, title is required');
			}

			const dataId = crypto.randomUUID();
			const contentId = crypto.randomUUID();

			const {
				title,
				slug,
				description,
				id: ___id,
				authorId: __authorId,
				updatedAt: __updatedAt,
				publishedAt: __publishedAt,
				...restPageData
			} = data;

			const { id, ...contentData } = content;

			yield* sdk.POST.databaseEntry.pages(
				{
					id: dataId,
					title,
					slug:
						slug ||
						title
							.toLowerCase()
							.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
							.replace(/\s+/g, '-') // Replace spaces with hyphens
							.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
							.replace(/^-|-$/g, ''), // Remove leading/trailing hyphens '-'),
					description: description || '',
					authorId: userId || null,
					updatedAt: new Date(),
					publishedAt: new Date(),
					...restPageData,
				},
				// @ts-expect-error drizzle broke the id variable
				{ id: contentId, ...contentData }
			);

			yield* Notifications.sendEditorNotification('new_page', data.title);

			return apiResponseLogger(200, `Page created successfully with id: ${dataId}`);
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, POST',
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
