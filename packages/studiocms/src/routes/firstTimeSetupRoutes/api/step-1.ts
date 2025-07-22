import { SDKCore } from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';
import { Effect } from 'effect';
import { convertToVanilla, genLogger } from '../../../lib/effects/index.js';
import { AllResponse, OptionsResponse } from '../../../lib/endpointResponses.js';

const HERO_IMAGE =
	'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const LOREM_IPSUM =
	'## Hello World \nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('studiocms:first-time-setup:step-1:POST')(function* () {
			const sdk = yield* SDKCore;

			const reqData = yield* Effect.tryPromise(() => context.request.json());

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
							error: 'Custom login page image is required if "custom" login page background is set',
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

			yield* sdk.POST.databaseEntries.pages([
				{
					pageData: {
						title: 'Home',
						slug: 'index',
						showOnNav: true,
						contentLang: 'default',
						description: 'Index page',
						heroImage: DefaultHeroOrUserSetOgImage,
						authorId: null,
						package: 'studiocms/markdown',
						publishedAt: new Date(),
						showAuthor: false,
						showContributors: false,
						updatedAt: new Date(),
						categories: [],
						contributorIds: [],
						draft: false,
						tags: [],
						parentFolder: null,
						id: crypto.randomUUID(),
					},
					pageContent: {
						content: LOREM_IPSUM,
						contentLang: 'default',
					},
				},
			]);

			return new Response(JSON.stringify({ message: 'Success' }), {
				status: 200,
			});
		}).pipe(SDKCore.Provide)
	).catch((error) => {
		console.error('Error in first time setup step 1:', error);
		if (error instanceof Error) {
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
	});

export const OPTIONS: APIRoute = async () => OptionsResponse(['POST']);

export const ALL: APIRoute = async () => AllResponse();
