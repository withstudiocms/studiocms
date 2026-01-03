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
	type HTTPMethod,
	OptionsResponse,
	readAPIContextJson,
	Schema,
} from '@withstudiocms/effect';
import { StudioCMSPageData } from '@withstudiocms/kysely';
import type { APIRoute } from 'astro';
import { verifyAuthTokenFromHeader } from '../../../utils/auth-token.js';
import type { EndpointRoute, SubPageRouter } from '../../../utils/rest-router.js';

type UpdatePageData = Partial<tsPageDataSelect>;
type UpdatePageContent = Partial<tsPageContentSelect>;

interface UpdatePageJson {
	pageId: string;
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

interface CreatePageJson {
	data?: tsPageDataSelect;
	content?: tsPageContentSelect;
}

const subPathRouter: Record<string, SubPageRouter> = {
	history: (id: string, _params?: Record<string, string>) =>
		createEffectAPIRoutes(
			{
				GET: (ctx) =>
					genLogger('studioCMS:rest:v1:public:pages:[id]:history:GET')(function* () {
						const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const page = yield* sdk.GET.page.byId(id);

						if (!page) {
							return apiResponseLogger(404, 'Page not found');
						}

						const searchParams = ctx.url.searchParams;

						const limitParam = searchParams.get('limit');
						const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
						const limit =
							typeof parsedLimit === 'number' && Number.isFinite(parsedLimit) && parsedLimit > 0
								? Math.min(parsedLimit, 100) // clamp to protect backend
								: undefined;

						const diffs =
							limit !== undefined
								? yield* sdk.diffTracking.get.byPageId.latest(id, limit)
								: yield* sdk.diffTracking.get.byPageId.all(id);

						return createJsonResponse(diffs);
					}),
				OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['GET', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
				},
			}
		),
	'history/[id]': (id: string, params?: Record<string, string>) =>
		createEffectAPIRoutes(
			{
				GET: (ctx) =>
					genLogger('studioCMS:rest:v1:pages:[id]:history:[diffid]:GET')(function* () {
						const sdk = yield* SDKCore;

						const user = yield* verifyAuthTokenFromHeader(ctx);

						if (user instanceof Response) {
							return user;
						}

						const { rank } = user;

						if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
							return apiResponseLogger(401, 'Unauthorized');
						}

						const diffid = params?.id;

						if (!id) {
							return apiResponseLogger(400, 'Invalid page ID');
						}

						if (!diffid) {
							return apiResponseLogger(400, 'Invalid diff ID');
						}

						const diff = yield* sdk.diffTracking.get.single(diffid);

						if (!diff) {
							return apiResponseLogger(404, 'Diff not found');
						}

						if (diff.pageId !== id) {
							return apiResponseLogger(404, 'Diff not found');
						}

						return createJsonResponse(diff);
					}),
				OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['GET', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
				},
			}
		),
};

export const pageIdRouter = (id: string) =>
	createEffectAPIRoutes(
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

function idOrPathRouter(id: string): Partial<Record<HTTPMethod | 'ALL', APIRoute>> {
	if (!id.includes('/')) {
		return pageIdRouter(id);
	}

	// Handle sub-paths
	const parts = id.split('/'); // /[id]/subpath/...

	if (parts.length === 1) {
		return subPathRouter[parts[0]](id);
	}

	const mainId = parts.shift() as string;
	const subPath = parts;

	if (subPath.length === 1) {
		const possibleSubRouter = subPathRouter[subPath[0] as keyof typeof subPathRouter];
		if (possibleSubRouter) {
			return possibleSubRouter(mainId);
		}
		return {};
	}

	// Nested sub-paths (built from string)
	if (subPath.length > 1 && subPath.length < 3) {
		const firstSubPath = subPath[0] as string;
		const secondSubPath = subPath[1] as string;

		const test = `${firstSubPath}/[id]`;
		const possibleSubRouter = subPathRouter[test as keyof typeof subPathRouter];
		if (possibleSubRouter) {
			return possibleSubRouter(mainId, { id: secondSubPath });
		}

		return {};
	}

	return {};
}

export const pagesRouter: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			GET: (ctx) =>
				genLogger('studioCMS:rest:v1:public:pages:GET')(function* () {
					const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

					if (user instanceof Response) {
						return user;
					}

					const { rank } = user;

					if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
						return apiResponseLogger(401, 'Unauthorized');
					}

					const pages = yield* sdk.GET.pages(true);

					const searchParams = ctx.url.searchParams;

					const titleFilter = searchParams.get('title');
					const slugFilter = searchParams.get('slug');
					const authorFilter = searchParams.get('author');
					const draftFilter = searchParams.get('draft') === 'true';
					const publishedFilter = searchParams.get('published') === 'true';
					const parentFolderFilter = searchParams.get('parentFolder');

					let filteredPages = pages;

					if (titleFilter) {
						filteredPages = filteredPages.filter((page) => page.title.includes(titleFilter));
					}

					if (slugFilter) {
						filteredPages = filteredPages.filter((page) => page.slug.includes(slugFilter));
					}

					if (authorFilter) {
						filteredPages = filteredPages.filter((page) => page.authorId === authorFilter);
					}

					if (draftFilter) {
						filteredPages = filteredPages.filter((page) => page.draft === draftFilter);
					}

					if (publishedFilter) {
						filteredPages = filteredPages.filter((page) => !page.draft);
					}

					if (parentFolderFilter) {
						filteredPages = filteredPages.filter(
							(page) => page.parentFolder === parentFolderFilter
						);
					}

					return createJsonResponse(filteredPages);
				}),
			POST: (ctx) =>
				genLogger('studioCMS:rest:v1:public:pages:POST')(function* () {
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

					const jsonData = yield* readAPIContextJson<CreatePageJson>(ctx);

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

					const {
						title,
						slug,
						description,
						categories,
						tags,
						contributorIds,
						augments,
						id: ___id,
						authorId: __authorId,
						updatedAt: __updatedAt,
						publishedAt: __publishedAt,
						...restPageData
					} = data;

					const { id: ____id, ...contentData } = content;

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
							authorId: userId,
							updatedAt: new Date().toISOString(),
							publishedAt: new Date().toISOString(),
							categories: JSON.stringify(categories || []),
							tags: JSON.stringify(tags || []),
							contributorIds: JSON.stringify(contributorIds || []),
							augments: JSON.stringify(augments || []),
							...restPageData,
						},
						{ ...contentData }
					);

					yield* notifier.sendEditorNotification('new_page', data.title);

					return apiResponseLogger(200, `Page created successfully with id: ${dataId}`);
				}).pipe(Notifications.Provide),
			OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'POST'] })),
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: { methods: ['GET', 'POST', 'OPTIONS'] },
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
		}
	),
	id: (id: string) => idOrPathRouter(id),
};
