import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext, APIRoute } from 'astro';

const HERO_IMAGE =
	'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const LOREM_IPSUM =
	'## Hello World \nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export const POST: APIRoute = async (context: APIContext) => {
	const reqData = await context.request.json();

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

	const Config = await studioCMS_SDK.GET.database.config();

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

	await studioCMS_SDK.INIT.siteConfig({
		title,
		description,
		defaultOgImage,
		diffPerPage,
		enableDiffs,
		loginPageBackground,
		loginPageCustomImage,
		siteIcon,
	}).catch(() => {
		return new Response(
			JSON.stringify({
				error: 'Config insert error',
			}),
			{
				status: 400,
			}
		);
	});

	await studioCMS_SDK.INIT.ghostUser().catch(() => {
		return new Response(
			JSON.stringify({
				error: 'Default Ghost user insert error',
			}),
			{
				status: 400,
			}
		);
	});

	await studioCMS_SDK.POST.databaseEntries
		.pages([
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
				},
				pageContent: {
					content: LOREM_IPSUM,
					contentLang: 'default',
				},
			},
		])
		.catch(() => {
			return new Response(
				JSON.stringify({
					error: 'Default pages insert error',
				}),
				{
					status: 400,
				}
			);
		});

	return new Response(JSON.stringify({ message: 'Success' }), {
		status: 200,
	});
};
