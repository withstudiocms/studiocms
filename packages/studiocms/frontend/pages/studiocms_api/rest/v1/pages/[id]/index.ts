import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageData, tsPageDataSelect } from 'studiocms:sdk/types';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
	Schema,
} from '@withstudiocms/effect';
import { StudioCMSPageData } from '@withstudiocms/kysely';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

interface UpdatePageJson {
	pageId: string;
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

export const { GET, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: (ctx) =>
			genLogger('studioCMS:rest:v1:pages:[id]:GET')(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid page ID');
				}

				const page = yield* sdk.GET.page.byId(id);

				if (!page) {
					return apiResponseLogger(404, 'Page not found');
				}

				return createJsonResponse(page);
			}),
		PATCH: (ctx) =>
			genLogger('studioCMS:rest:v1:pages:[id]:PATCH')(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank, userId } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid page ID');
				}

				const jsonData = yield* readAPIContextJson<UpdatePageJson>(ctx);

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
				if (data.id !== id) {
					return apiResponseLogger(400, 'Payload id does not match path id');
				}

				const currentPageData = yield* sdk.GET.page.byId(id);

				if (!currentPageData) {
					return apiResponseLogger(404, 'Page not found');
				}

				const { authorId, contributorIds, defaultContent } = currentPageData;

				let AuthorId = authorId;

				if (!authorId) {
					AuthorId = userId;
				}

				const ContributorIds = contributorIds || [];

				if (!ContributorIds.includes(userId)) {
					ContributorIds.push(userId);
				}

				const newData: tsPageData['Insert']['Type'] = {
					...(data as tsPageDataSelect),
					authorId: AuthorId,
					contributorIds: JSON.stringify(ContributorIds),
					updatedAt: new Date().toISOString(),
					publishedAt: data.publishedAt?.toISOString() || new Date().toISOString(),
					categories: JSON.stringify(data.categories || []),
					tags: JSON.stringify(data.tags || []),
					augments: JSON.stringify(data.augments || []),
				};

				const getMetaData = sdk.dbService.withCodec({
					encoder: Schema.String,
					decoder: StudioCMSPageData.Select,
					callbackFn: (query, input) =>
						query((db) =>
							db
								.selectFrom('StudioCMSPageData')
								.selectAll()
								.where('id', '=', input)
								.executeTakeFirstOrThrow()
						),
				});

				const startMetaData = yield* getMetaData(data.id);

				yield* sdk.UPDATE.page.byId(data.id, {
					pageData: newData,
					pageContent: content as tsPageContentSelect,
				});

				const updatedMetaData = yield* getMetaData(data.id);

				const siteConfig = yield* sdk.GET.siteConfig();

				if (!siteConfig) {
					return apiResponseLogger(500, 'Site configuration not found');
				}

				const { enableDiffs, diffPerPage = 10 } = siteConfig.data;

				if (enableDiffs) {
					yield* sdk.diffTracking.insert(
						userId,
						data.id,
						{
							content: {
								start: defaultContent?.content || '',
								end: content.content || '',
							},
							// biome-ignore lint/style/noNonNullAssertion: This is a valid use case for non-null assertion
							metaData: { start: startMetaData!, end: updatedMetaData! },
						},
						diffPerPage
					);
				}

				yield* sdk.CLEAR.page.byId(id);

				// biome-ignore lint/style/noNonNullAssertion: This is a valid use case for non-null assertion
				yield* notifier.sendEditorNotification('page_updated', updatedMetaData!.title);

				return apiResponseLogger(200, 'Page updated successfully');
			}).pipe(Notifications.Provide),
		DELETE: (ctx) =>
			genLogger('studioCMS:rest:v1:pages:[id]:DELETE')(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const { id } = ctx.params;

				if (!id) {
					return apiResponseLogger(400, 'Invalid page ID');
				}

				const jsonData = yield* readAPIContextJson<{ slug: string }>(ctx);

				const { slug } = jsonData;

				if (!slug) {
					return apiResponseLogger(400, 'Invalid request');
				}

				const page = yield* sdk.GET.page.byId(id);

				if (!page) {
					return apiResponseLogger(404, 'Page not found');
				}

				yield* sdk.DELETE.page(id);
				yield* sdk.CLEAR.page.byId(id);

				yield* notifier.sendEditorNotification('page_deleted', page.title);

				return apiResponseLogger(200, 'Page deleted successfully');
			}).pipe(Notifications.Provide),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse(
				{ error: 'Internal Server Error' },
				{
					status: 500,
				}
			);
		},
	}
);
