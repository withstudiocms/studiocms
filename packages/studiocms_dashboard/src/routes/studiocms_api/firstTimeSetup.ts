import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import studioCMS_SDK from 'studiocms:sdk';
import type { APIContext } from 'astro';

function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

function parseFormDataBoolean(formData: FormData, key: string): boolean {
	const value = formData.get(key);
	if (typeof value === 'string' && value === '1') {
		return true;
	}
	return false;
}

const HERO_IMAGE =
	'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const LOREM_IPSUM =
	'## Hello World \nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export async function POST(context: APIContext): Promise<Response> {
	// Get the form data
	const formData = await context.request.formData();

	// Parse the form data
	const setupLocalAdmin = parseFormDataBoolean(formData, 'local-setup');
	const title = parseFormDataEntryToString(formData, 'title');
	const description = parseFormDataEntryToString(formData, 'description');
	const ogImage = parseFormDataEntryToString(formData, 'ogImage');
	const username = parseFormDataEntryToString(formData, 'local-admin-name');
	const password = parseFormDataEntryToString(formData, 'local-admin-password');
	const name = parseFormDataEntryToString(formData, 'local-admin-display-name');
	const email = parseFormDataEntryToString(formData, 'local-admin-email') || 'admin@example.com';
	const oAuthAdmin = parseFormDataEntryToString(formData, 'oauth-admin-name');

	// Set the default og image to the hero image if not provided
	const DefaultHeroOrUserSetOgImage = ogImage || HERO_IMAGE;

	let userId = '';

	if (!title || !description) {
		return new Response(
			JSON.stringify({
				error: 'Missing Data: Site Title and Description are required',
			}),
			{
				status: 400,
			}
		);
	}

	if (setupLocalAdmin) {
		if (!username || !password || !name) {
			return new Response(
				JSON.stringify({
					error: 'Missing Data',
				}),
				{
					status: 400,
				}
			);
		}

		if (verifyUsernameInput(username) !== true) {
			return new Response(
				JSON.stringify({
					error:
						'Invalid Username: Username must be between 3 and 20 characters, only contain lowercase letters, numbers, -, and _ as well as not be a commonly used username (admin, root, etc.)',
				}),
				{
					status: 400,
				}
			);
		}

		if ((await verifyPasswordStrength(password)) !== true) {
			return new Response(
				JSON.stringify({
					error:
						'Invalid Password: Password must be between 6 and 255 characters, and not be in the <a href="https://haveibeenpwned.com/Passwords" target="_blank">pwned password database</a>.',
				}),
				{
					status: 400,
				}
			);
		}

		try {
			// Create the new user
			const newUser = await createLocalUser(name, username, email, password);
			await studioCMS_SDK.POST.databaseEntry.permissions(newUser.id, 'owner');
			userId = newUser.id;
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: 'Error creating user',
				}),
				{
					status: 400,
				}
			);
		}
	} else {
		if (!oAuthAdmin || oAuthAdmin) {
			return new Response(
				JSON.stringify({
					error: 'Initial oAuth admin setup is not yet implemented',
				}),
				{
					status: 400,
				}
			);
		}
		// TODO: Implement new OAuth admin setup
		// await db.insert(tsPermissions).values({
		// 	username: oAuthAdmin as string,
		// 	rank: 'admin',
		// });
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
		defaultOgImage: DefaultHeroOrUserSetOgImage,
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
					authorId: userId,
					package: 'studiocms',
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
			{
				pageData: {
					title: 'About',
					slug: 'about',
					showOnNav: true,
					contentLang: 'default',
					description: 'About page',
					heroImage: DefaultHeroOrUserSetOgImage,
					authorId: userId,
					package: 'studiocms',
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

	return new Response();
}
