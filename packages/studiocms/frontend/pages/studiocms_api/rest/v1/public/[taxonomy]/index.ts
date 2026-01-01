import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	genLogger,
	OptionsResponse,
} from '@withstudiocms/effect';
import { Effect, type ParseResult, Schema } from 'effect';
import { extractParams } from '../../../utils/param-extractor';

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

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: extractParams(paramSchema)(({ taxonomy }, ctx) =>
			genLogger(`studiocms:rest:v1:${taxonomy}:GET`)(function* () {
				const sdk = yield* SDKCore;

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
						return createJsonResponse({ error: 'Invalid taxonomy' }, { status: 400 });
					}
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
