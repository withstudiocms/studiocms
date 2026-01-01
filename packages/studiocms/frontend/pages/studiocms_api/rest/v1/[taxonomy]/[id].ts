import { apiResponseLogger } from 'studiocms:logger';
import { Notifications } from 'studiocms:notifier';
import { SDKCore } from 'studiocms:sdk';
import { AllResponse, createJsonResponse, genLogger, OptionsResponse } from '@withstudiocms/effect';
import { Effect, type ParseResult, Schema } from 'effect';
import { createEffectAPIRoutes } from 'node_modules/@withstudiocms/effect/dist/astro/api-route';
import { verifyAuthTokenFromHeader } from '../../utils/auth-token';
import { extractParams } from '../../utils/param-extractor';

const paramSchemaBase = Schema.Struct({
	taxonomy: Schema.Literal('categories', 'tags'),
	id: Schema.NumberFromString,
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

export const { GET, PATCH, DELETE, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:GET`)(function* () {
				const [sdk, user] = yield* Effect.all([SDKCore, verifyAuthTokenFromHeader(ctx)]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				switch (taxonomy) {
					case 'categories': {
						const category = yield* sdk.GET.categories.byId(id);
						if (!category) {
							return apiResponseLogger(404, 'Category not found');
						}
						return createJsonResponse(category);
					}
					case 'tags': {
						const tag = yield* sdk.GET.tags.byId(id);
						if (!tag) {
							return apiResponseLogger(404, 'Tag not found');
						}
						return createJsonResponse(tag);
					}
					default:
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
				}
			})
		),
		// TODO: Implement PATCH method
		PATCH: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:PATCH`)(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				return createJsonResponse({ error: 'Not implemented yet' }, { status: 501 });
			}).pipe(Notifications.Provide)
		),
		// TODO: Implement DELETE method
		DELETE: extractParams(paramSchema)(({ taxonomy, id }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:DELETE`)(function* () {
				const [sdk, user, notifier] = yield* Effect.all([
					SDKCore,
					verifyAuthTokenFromHeader(ctx),
					Notifications,
				]);

				if (user instanceof Response) {
					return user;
				}

				const { rank } = user;

				if (rank !== 'owner' && rank !== 'admin' && rank !== 'editor') {
					return apiResponseLogger(401, 'Unauthorized');
				}

				return createJsonResponse({ error: 'Not implemented yet' }, { status: 501 });
			}).pipe(Notifications.Provide)
		),
		OPTIONS: () =>
			Effect.try(() => OptionsResponse({ allowedMethods: ['GET', 'PATCH', 'DELETE'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
