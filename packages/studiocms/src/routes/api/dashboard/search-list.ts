import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

type SearchItem = {
	id: string;
	name: string;
	slug?: string;
	type: 'folder' | 'page';
	isDraft?: boolean | null;
};

export const { GET, OPTIONS, ALL } = createEffectAPIRoutes(
	{
		GET: () =>
			genLogger('studiocms/routes/api/dashboard/search-list.GET')(function* () {
				const sdk = yield* SDKCore;

				const searchList = yield* Effect.all([
					sdk.GET.folderList().pipe(
						Effect.map((res) => res.data.map(({ id, name }) => ({ id, name, type: 'folder' })))
					),
					sdk.GET.pages().pipe(
						Effect.map((res) =>
							res.map(({ data: { id, title, slug, draft } }) => ({
								id,
								name: title,
								slug,
								isDraft: draft,
								type: 'page',
							}))
						)
					),
				]).pipe(Effect.map(([folders, pages]) => [...folders, ...pages] as SearchItem[]));

				return createJsonResponse(searchList);
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['GET'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['GET', 'OPTIONS'] },
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
