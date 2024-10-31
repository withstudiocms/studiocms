import { db, eq } from 'astro:db';
import { verifyPasswordStrength } from 'studiocms:auth/lib/password';
import { createUserSession } from 'studiocms:auth/lib/session';
import { createLocalUser, verifyUsernameInput } from 'studiocms:auth/lib/user';
import { CMSSiteConfigId } from '@studiocms/core/consts';
import {
	tsPageContent,
	tsPageData,
	tsPermissions,
	tsSiteConfig,
	// tsUsers,
} from '@studiocms/core/db/tsTables';
import type { APIContext } from 'astro';

function parseFormDataEntryToString(formData: FormData, key: string): string | null {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return null;
	}
	return value;
}

export async function POST(context: APIContext): Promise<Response> {
	const formData = await context.request.formData();

	const setupLocalAdmin = formData.get('local-setup');

	console.log(setupLocalAdmin);

	if (setupLocalAdmin === '1') {
		// Get the formdata
		const username = parseFormDataEntryToString(formData, 'local-admin-name');
		const password = parseFormDataEntryToString(formData, 'local-admin-password');
		const name = parseFormDataEntryToString(formData, 'local-admin-display-name');
		const email = parseFormDataEntryToString(formData, 'local-admin-email') || 'admin@example.com';

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
						'Invalid Password: Password must be between 6 and 255 characters, not be a known unsafe password, and not be in the pwned password database',
				}),
				{
					status: 400,
				}
			);
		}

		const newUser = await createLocalUser(name, username, email, password);

		await db.insert(tsPermissions).values({
			user: newUser.id,
			rank: 'owner',
		});
	} else {
		const oAuthAdmin = parseFormDataEntryToString(formData, 'oauth-admin-name');

		if (!oAuthAdmin || oAuthAdmin) {
			return new Response(
				JSON.stringify({
					error: 'oAuth Admin setup not yet implemented',
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

	const title = formData.get('title');
	const description = formData.get('description');
	const ogImage = formData.get('ogImage');

	const Config = await db
		.select()
		.from(tsSiteConfig)
		.where(eq(tsSiteConfig.id, CMSSiteConfigId))
		.get();

	if (Config) {
		return new Response(
			JSON.stringify({
				error: 'Config Error: Already Exists',
			}),
			{
				status: 400,
			}
		);
	}

	// Insert Site Config
	await db
		.insert(tsSiteConfig)
		.values({
			title: title as string,
			description: description as string,
			defaultOgImage: (ogImage as string) || null,
		})
		.catch(() => {
			return new Response(
				JSON.stringify({
					error: 'Config Error',
				}),
				{
					status: 400,
				}
			);
		});

	const HERO_IMAGE =
		'https://images.unsplash.com/photo-1707343843982-f8275f3994c5?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
	const LOREM_IPSUM =
		'## Hello World \nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

	await db.insert(tsPageData).values([
		{
			id: crypto.randomUUID(),
			title: 'Home',
			slug: 'index',
			showOnNav: true,
			contentLang: 'default',
			description: 'Index page',
			heroImage: HERO_IMAGE,
		},
		{
			id: crypto.randomUUID(),
			title: 'About',
			slug: 'about',
			showOnNav: true,
			contentLang: 'default',
			description: 'About page',
			heroImage: HERO_IMAGE,
		},
	]);

	const index = await db.select().from(tsPageData).where(eq(tsPageData.slug, 'index')).get();
	const about = await db.select().from(tsPageData).where(eq(tsPageData.slug, 'about')).get();

	if (!index || !about) {
		return new Response(
			JSON.stringify({
				error: 'Page Data Error',
			}),
			{
				status: 400,
			}
		);
	}

	// Insert Page Content
	await db
		.insert(tsPageContent)
		.values([
			{
				id: crypto.randomUUID(),
				contentId: index.id,
				contentLang: 'default',
				content: LOREM_IPSUM,
			},
			{
				id: crypto.randomUUID(),
				contentId: about.id,
				contentLang: 'default',
				content: LOREM_IPSUM,
			},
		])
		.catch(() => {
			return new Response(
				JSON.stringify({
					error: 'Page Content Error',
				}),
				{
					status: 400,
				}
			);
		});

	return new Response();
}
