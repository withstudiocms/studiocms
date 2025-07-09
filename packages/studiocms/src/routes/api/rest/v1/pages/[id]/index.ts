import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../../../../lib/effects/index.js';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

interface UpdatePageJson {
	pageId: string;
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

export const GET: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:[id]:GET')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid page ID');
			}

			const page = yield* sdk.GET.page.byId(id);

			if (!page) {
				return apiResponseLogger(404, 'Page not found');
			}

			return new Response(JSON.stringify(page), {
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const PATCH: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:[id]:PATCH')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank, userId } = user;

			if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid page ID');
			}

			const jsonData: UpdatePageJson = yield* Effect.tryPromise(() => context.request.json());

			const { data, content } = jsonData;

			if (!data) {
				return apiResponseLogger(400, 'Invalid form data, data is required');
			}

			if (!content) {
				return apiResponseLogger(400, 'Invalid form data, content is required');
			}

			if (!data.id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			if (!content.id) {
				return apiResponseLogger(400, 'Invalid form data, id is required');
			}

			const currentPageData = yield* sdk.GET.page.byId(id);

			if (!currentPageData) {
				return apiResponseLogger(404, 'Page not found');
			}

			const { authorId, contributorIds } = currentPageData.data;

			let AuthorId = authorId;

			if (!authorId) {
				AuthorId = userId || null;
			}

			const ContributorIds = contributorIds || [];

			if (!ContributorIds.includes(userId)) {
				ContributorIds.push(userId);
			}

			data.authorId = AuthorId;
			data.contributorIds = JSON.stringify(ContributorIds);
			data.updatedAt = new Date();

			const startMetaData = (yield* sdk.GET.databaseTable.pageData()).find(
				(metaData) => metaData.id === data.id
			);

			const {
				data: { defaultContent },
			} = yield* sdk.GET.page.byId(data.id);

			const updated = yield* sdk.UPDATE.page.byId(data.id, {
				pageData: data as tsPageDataSelect,
				pageContent: content as tsPageContentSelect,
			});

			const updatedMetaData = (yield* sdk.GET.databaseTable.pageData()).find(
				(metaData) => metaData.id === data.id
			);

			const { enableDiffs, diffPerPage } = (yield* sdk.GET.siteConfig()).data;

			if (enableDiffs) {
				yield* sdk.diffTracking.insert(
					userId,
					data.id,
					{
						content: {
							start: defaultContent?.content || '',
							end: content.content || '',
						},
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						metaData: { start: startMetaData!, end: updatedMetaData! },
					},
					diffPerPage
				);
			}

			yield* sdk.CLEAR.page.byId(id);

			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			yield* Notifications.sendEditorNotification('page_updated', updatedMetaData!.title);

			return apiResponseLogger(200, 'Page updated successfully');
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const DELETE: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studioCMS:rest:v1:public:pages:[id]:DELETE')(function* () {
			const sdk = yield* SDKCore;

			const user = yield* verifyAuthTokenFromHeader(context);

			if (user instanceof Response) {
				return user;
			}

			const { rank } = user;

			if (rank !== 'owner' && rank !== 'admin') {
				return apiResponseLogger(401, 'Unauthorized');
			}

			const { id } = context.params;

			if (!id) {
				return apiResponseLogger(400, 'Invalid page ID');
			}

			const jsonData = yield* Effect.tryPromise(() => context.request.json());

			const { slug } = jsonData;

			if (!slug) {
				return apiResponseLogger(400, 'Invalid request');
			}

			const isHomePage = yield* sdk.GET.page.bySlug('index');

			if (isHomePage.data && isHomePage.data.id === id) {
				return apiResponseLogger(400, 'Cannot delete home page');
			}

			const page = yield* sdk.GET.page.byId(id);

			if (!page) {
				return apiResponseLogger(404, 'Page not found');
			}

			yield* sdk.DELETE.page(id);
			yield* sdk.CLEAR.page.byId(id);

			yield* Notifications.sendEditorNotification('page_deleted', page.data.title);

			return apiResponseLogger(200, 'Page deleted successfully');
		}).pipe(SDKCore.Provide, Notifications.Provide)
	).catch((error) => {
		return apiResponseLogger(500, 'Internal Server Error', error);
	});

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, GET, PATCH, DELETE',
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
			'Access-Control-Allow-Origin': '*',
		},
	});
};
