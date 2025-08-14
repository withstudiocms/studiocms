import { SDKCore } from 'studiocms:sdk';
import {
	AllResponse,
	createEffectAPIRoutes,
	Effect,
	genLogger,
	OptionsResponse,
} from '../../../effect.js';

const HERO_IMAGE =
	'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const { ALL, OPTIONS, POST } = createEffectAPIRoutes(
	{
		POST: (ctx) =>
			genLogger('studiocms:first-time-setup:step-1:POST')(function* () {
				const sdk = yield* SDKCore;

				const reqData = yield* Effect.tryPromise(() => ctx.request.json());

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

				if (!title) {
					return new Response(
						JSON.stringify({
							error: 'Title is required',
						}),
						{
							status: 400,
						}
					);
				}

				if (!description) {
					return new Response(
						JSON.stringify({
							error: 'Description is required',
						}),
						{
							status: 400,
						}
					);
				}

				if (loginPageBackground === 'custom') {
					if (!loginPageCustomImage) {
						return new Response(
							JSON.stringify({
								error:
									'Custom login page image is required if "custom" login page background is set',
							}),
							{
								status: 400,
							}
						);
					}
				}

				const Config = yield* sdk.GET.siteConfig();

				if (Config) {
					return new Response(
						JSON.stringify({
							error:
								'Config already exists, please delete the existing config to run setup again. Or create a new database.',
						}),
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

				return new Response(JSON.stringify({ message: 'Success' }), {
					status: 200,
				});
			}),
		OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST'] })),
		ALL: () => Effect.try(() => AllResponse()),
	},
	{
		cors: { methods: ['POST', 'OPTIONS'] },
		onError: (error) => {
			if (error instanceof Error) {
				console.error('Error in first time setup step 1:', error);
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
					statusText: 'Internal Server Error',
				});
			}
			// Fallback for non-Error exceptions
			console.error('Non-Error exception:', error);
			// Return a generic error response
			// This could happen if the error is not an instance of Error
			// or if the error handling is not as expected.
			return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
				status: 500,
				statusText: 'Internal Server Error',
			});
		},
	}
);
