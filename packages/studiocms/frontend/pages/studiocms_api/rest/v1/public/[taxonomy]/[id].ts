import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import { Effect, type ParseResult, Schema } from 'effect';
import { extractParams } from '../../../utils/param-extractor.js';

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

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: extractParams(paramSchema)(({ taxonomy, id }) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:${id}:GET`)(function* () {
				const sdk = yield* SDKCore;

				switch (taxonomy) {
					case 'categories': {
						const category = yield* sdk.GET.categories.byId(id);

						if (!category) {
							return createJsonResponse({ error: 'Category not found' }, { status: 404 });
						}

						return createJsonResponse(category);
					}
					case 'tags': {
						const tag = yield* sdk.GET.tags.byId(id);

						if (!tag) {
							return createJsonResponse({ error: 'Tag not found' }, { status: 404 });
						}

						return createJsonResponse(tag);
					}
					default:
						return createJsonResponse({ error: 'Unknown taxonomy type' }, { status: 400 });
				}
			})
		),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
		onError: (error) => {
			console.error('API Error:', error);
			return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
		},
	}
);
