import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	createJsonResponse,
	Effect,
	genLogger,
	OptionsResponse,
	readAPIContextJson,
} from '../../../effect.js';

const HERO_IMAGE =
	'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const { ALL, OPTIONS, POST } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms:first-time-setup:step-1:POST')(function* () {
				const [sdk, reqData] = yield* Effect.all([
					SDKCore,
					readAPIContextJson<{
						title: string;
						description: string;
						defaultOgImage: string;
						siteIcon: string;
						enableDiffs: boolean;
						diffPerPage: number;
						loginPageBackground: string;
						loginPageCustomImage: string;
					}>(ctx),
				]);

				const {
					title,
					description,
					defaultOgImage,
					siteIcon,
					enableDiffs,
					diffPerPage,
					loginPageBackground,
					loginPageCustomImage,
				} = reqData;

				const DefaultHeroOrUserSetOgImage = defaultOgImage || HERO_IMAGE;

				if (typeof enableDiffs !== 'boolean') {
					return createJsonResponse({ error: 'enableDiffs must be a boolean' }, { status: 400 });
				}
				if (typeof diffPerPage !== 'number' || !Number.isInteger(diffPerPage) || diffPerPage <= 0) {
					return createJsonResponse(
						{ error: 'diffPerPage must be a positive integer' },
						{ status: 400 }
					);
				}

				if (!title) {
					return createJsonResponse(
						{ error: 'Title is required' },
						{
							status: 400,
						}
					);
				}

				if (!description) {
					return createJsonResponse(
						{ error: 'Description is required' },
						{
							status: 400,
						}
					);
				}

				if (loginPageBackground === 'custom') {
					if (!loginPageCustomImage) {
						return createJsonResponse(
							{
								error:
									'Custom login page image is required if "custom" login page background is set',
							},
							{
								status: 400,
							}
						);
					}
				}

				const Config = yield* sdk.GET.siteConfig();

				if (Config) {
					return createJsonResponse(
						{
							error:
								'Config already exists, please delete the existing config to run setup again. Or create a new database.',
						},
						{
							status: 400,
						}
					);
				}

				yield* sdk.INIT.siteConfig({
					title,
					description,
					defaultOgImage: DefaultHeroOrUserSetOgImage,
					diffPerPage,
					enableDiffs,
					loginPageBackground,
					loginPageCustomImage,
					siteIcon,
					enableMailer: false,
					gridItems: [],
					hideDefaultIndex: false,
				});

				yield* sdk.INIT.ghostUser();

				return createJsonResponse({ message: 'Success' }, { status: 200 });
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			if (error instanceof Error) {
				console.error('Error in first time setup step 1:', error);
				return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
			}
			// Fallback for non-Error exceptions
			console.error('Non-Error exception:', error);
			// Return a generic error response
			// This could happen if the error is not an instance of Error
			// or if the error handling is not as expected.
			return createJsonResponse({ error: 'Internal Server Error' }, { status: 500 });
		},
	}
);
