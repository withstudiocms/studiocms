import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import type { tsPageContentSelect, tsPageDataSelect } from 'studiocms:sdk/types';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../../../effect.js';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';

type UpdatePageData = tsPageDataSelect;
type UpdatePageContent = tsPageContentSelect;

interface CreatePageJson {
	data?: UpdatePageData;
	content?: UpdatePageContent;
}

export const { GET, POST, ALL, OPTIONS } = createEffectAPIRoutes(
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
						authorId: userId || null,
						updatedAt: new Date(),
						publishedAt: new Date(),
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
);
