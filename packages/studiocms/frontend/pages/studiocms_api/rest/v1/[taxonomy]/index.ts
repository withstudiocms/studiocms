import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	genLogger,
	OptionsResponse,
	parseAPIContextJson,
} from '@withstudiocms/effect';
import { StudioCMSPageDataCategories, StudioCMSPageDataTags } from '@withstudiocms/kysely';
import { Effect, type ParseResult, Schema } from 'effect';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token.js';
import { extractParams } from '../../utils/param-extractor.js';

const paramSchemaBase = Schema.Struct({
	taxonomy: Schema.Literal('categories', 'tags'),
});

const firstLetterUppercase = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

const getTaxonomyLabel = ({ actual }: ParseResult.ParseIssue) => {
	if (Schema.is(paramSchemaBase)(actual)) {
		return `Taxonomy: ${firstLetterUppercase(actual.taxonomy)}`;
	}
};

const paramSchema = paramSchemaBase.annotations({
	identifier: 'TaxonomyParams',
	parseIssueTitle: getTaxonomyLabel,
});

export const { GET, POST, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: extractParams(paramSchema)(({ taxonomy }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:GET`)(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				const searchParams = ctx.url.searchParams;
				const folderNameFilter = searchParams.get('name');
				const folderParentFilter = searchParams.get('parent');

				switch (taxonomy) {
					case 'categories': {
						let categories = yield* sdk.GET.categories.getAll();

						if (folderNameFilter) {
							categories = categories.filter((category) =>
								category.name.includes(folderNameFilter)
							);
						}

						if (folderParentFilter) {
							categories = categories.filter(
								(category) => category.parent === Number.parseInt(folderParentFilter, 10)
							);
						}

						return createJsonResponse(categories);
					}
					case 'tags': {
						let tags = yield* sdk.GET.tags.getAll();

						if (folderNameFilter) {
							tags = tags.filter((tag) => tag.name.includes(folderNameFilter));
						}

						return createJsonResponse(tags);
					}
					default: {
						return createJsonResponse(
							{
								error: 'Unknown taxonomy type',
							},
							{ status: 400 }
						);
					}
				}
			})
		),
		POST: extractParams(paramSchema)(({ taxonomy }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:POST`)(function* () {
				const [notifier, user, sdk] = yield* Effect.all([
					Notifications,
					verifyAuthTokenFromHeader(ctx),
					SDKCore,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				switch (taxonomy) {
					case 'categories': {
						return yield* parseAPIContextJson(
							ctx,
							StudioCMSPageDataCategories.Insert.omit('id')
						).pipe(
							Effect.flatMap((data) =>
								Effect.gen(function* () {
									const id = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
									return { id, ...data };
								})
							),
							Effect.flatMap((data) =>
								sdk.POST.databaseEntry.categories(data).pipe(Effect.as(data))
							),
							Effect.tap((data) => notifier.sendEditorNotification('new_category', data.name)),
							Effect.map(createJsonResponse)
						);
					}
					case 'tags': {
						return yield* parseAPIContextJson(ctx, StudioCMSPageDataTags.Insert.omit('id')).pipe(
							Effect.flatMap((data) =>
								Effect.gen(function* () {
									const id = yield* sdk.UTIL.Generators.generateRandomIDNumber(9);
									return { id, ...data };
								})
							),
							Effect.flatMap((data) => sdk.POST.databaseEntry.tags(data).pipe(Effect.as(data))),
							Effect.tap((data) => notifier.sendEditorNotification('new_tag', data.name)),
							Effect.map(createJsonResponse)
						);
					}
					default: {
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
					}
				}
			}).pipe(Notifications.Provide)
		),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'POST', 'OPTIONS'] },
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
