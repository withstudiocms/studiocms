import path from 'node:path';
import { SDKCore } from 'studiocms:sdk';
import type { SiteConfig } from 'studiocms:sdk/types';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { Console, Effect, genLogger } from 'studiocms/effect';
import type {
	tsPageContent,
	tsPageData,
} from 'studiocms/sdk/tables';
import type { Page, SiteSettings } from '../../schema/wp-api.js';
import { WordPressAPIConverters } from './converters.js';
import { WordPressAPIUtils } from './utils.js';

export type PageData = typeof tsPageData.$inferInsert;
export type PageContent = typeof tsPageContent.$inferInsert;

/**
 * User's Astro Public Folder
 */
const ASTRO_PUBLIC_FOLDER = path.resolve(userProjectRoot, 'public');

export class WordPressAPI extends Effect.Service<WordPressAPI>()('WordPressAPI', {
	dependencies: [SDKCore.Default, WordPressAPIUtils.Default, WordPressAPIConverters.Default],
	effect: genLogger('@studiocms/devapps/effects/WordPressAPI.effect')(function* () {
		const sdk = yield* SDKCore;

		const { apiEndpoint, downloadPostImage, fetchAll } = yield* WordPressAPIUtils;

		const { convertToPageContent, convertToPageData, convertToPostContent, convertToPostData } =
			yield* WordPressAPIConverters;

		/**
		 * Imports site settings from a WordPress API endpoint and updates the local database.
		 *
		 * @param endpoint - The WordPress API endpoint to fetch settings from.
		 *
		 * This function performs the following steps:
		 * 1. Constructs the URL for the settings endpoint.
		 * 2. Fetches the site settings from the constructed URL.
		 * 3. Logs the fetched settings.
		 * 4. Downloads the site icon if available.
		 * 5. If the site icon is not available, attempts to download the site logo.
		 * 6. Constructs the site configuration object.
		 * 7. Updates the local database with the fetched settings.
		 * 8. Logs the success or failure of the database update.
		 */
		const importSettingsFromWPAPI = (endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importSettingsFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'settings');

					yield* Console.log('Fetching site settings from: ', url.origin);

					const response = yield* Effect.tryPromise(() => fetch(url));
					const settings: SiteSettings = yield* Effect.tryPromise(() => response.json());

					yield* Console.log('Importing site settings: ', settings);

					let siteIcon: string | undefined = undefined;

					if (settings.site_icon_url) {
						siteIcon = yield* downloadPostImage(settings.site_icon_url, ASTRO_PUBLIC_FOLDER);
					}

					if (!settings.site_icon_url && settings.site_logo) {
						const siteLogoUrl = yield* apiEndpoint(endpoint, 'media', String(settings.site_logo));
						const siteLogoResponse = yield* Effect.tryPromise(() => fetch(siteLogoUrl));
						const siteLogoData = yield* Effect.tryPromise(() => siteLogoResponse.json());

						siteIcon = yield* downloadPostImage(siteLogoData.source_url, ASTRO_PUBLIC_FOLDER);
					}

					const siteConfig: Partial<SiteConfig> = {
						title: settings.name,
						description: settings.description,
					};

					if (siteIcon) {
						siteConfig.siteIcon = siteIcon;
					}

					// @ts-expect-error - Drizzle broken types
					const insert = yield* sdk.UPDATE.siteConfig(siteConfig);

					if (insert.lastCacheUpdate) {
						yield* Console.log('Updated site settings');
					} else {
						yield* Console.error('Failed to update site settings');
					}
				}
			);

		/**
		 * Imports pages from a WordPress API endpoint.
		 *
		 * This function fetches all pages from the specified WordPress API endpoint
		 * and imports each page individually.
		 *
		 * @param endpoint - The WordPress API endpoint to fetch pages from.
		 */
		const importPagesFromWPAPI = (endpoint: string) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importPagesFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'pages');

					yield* Console.log('fetching pages from: ', url.origin);

					const pages: Page[] = yield* fetchAll(url);

					yield* Console.log('Total pages: ', pages.length);

					for (const page of pages) {
						yield* Console.log('importing page:', page.title.rendered);

						const pageData = yield* convertToPageData(page, endpoint);
						const pageContent = yield* convertToPageContent(pageData, page);

						// @ts-expect-error - Drizzle broken types
						yield* sdk.POST.databaseEntry.pages(pageData, pageContent);

						yield* Console.log('- Imported new page from WP-API: ', page.title.rendered);
					}
				}
			);

		/**
		 * Imports a post from the WordPress API and inserts the post data and content into the database.
		 *
		 * @param post - The post data to be imported. The structure of this object is determined by the `generatePostFromData` function.
		 * @param useBlogPkg - A boolean flag indicating whether to use the blog package for generating the post data.
		 * @param endpoint - The API endpoint to be used for generating the post data.
		 */
		const importPostsFromWPAPI = (endpoint: string, useBlogPkg: boolean) =>
			genLogger('@studiocms/devapps/effects/WordPressAPI.effect.importPagesFromWPAPI')(
				function* () {
					const url = yield* apiEndpoint(endpoint, 'posts');

					yield* Console.log('fetching posts from: ', url.origin);

					const pages: Page[] = yield* fetchAll(url);

					yield* Console.log('Total posts: ', pages.length);

					for (const page of pages) {
						yield* Console.log('importing post:', page.title.rendered);

						const pageData = yield* convertToPostData(page, useBlogPkg, endpoint);
						const pageContent = yield* convertToPostContent(pageData, page);

						// @ts-expect-error - Drizzle broken types
						yield* sdk.POST.databaseEntry.pages(pageData, pageContent);

						yield* Console.log('- Imported new post from WP-API: ', page.title.rendered);
					}
				}
			);

		return {
			importSettingsFromWPAPI,
			importPagesFromWPAPI,
			importPostsFromWPAPI,
		};
	}),
}) {
	static Provide = Effect.provide(this.Default);
}
