import path from 'node:path';
import { db, eq } from 'astro:db';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { CMSSiteConfigId } from 'studiocms/consts';
import { tsSiteConfig } from 'studiocms/sdk/tables';
import type { SiteSettings } from '../../schema/wp-api.js';
import { apiEndpoint, downloadPostImage } from './utils.js';

const ASTROPUBLICFOLDER = path.resolve(userProjectRoot, 'public');

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
 *
 * @throws Will log an error message if the fetch or database update fails.
 */
export const importSettingsFromWPAPI = async (endpoint: string) => {
	const url = apiEndpoint(endpoint, 'settings');

	console.log('Fetching site settings from: ', url.origin);

	const response = await fetch(url);
	const settings: SiteSettings = await response.json();

	console.log('Importing site settings: ', settings);

	let siteIcon: string | undefined = undefined;

	if (settings.site_icon_url) {
		siteIcon = await downloadPostImage(settings.site_icon_url, ASTROPUBLICFOLDER);
	}

	if (!settings.site_icon_url && settings.site_logo) {
		const siteLogoURL = apiEndpoint(endpoint, 'media', `${settings.site_logo}`);
		const siteLogoResponse = await fetch(siteLogoURL);
		const siteLogoJson = await siteLogoResponse.json();
		siteIcon = await downloadPostImage(siteLogoJson.source_url, ASTROPUBLICFOLDER);
	}

	const siteConfig: typeof tsSiteConfig.$inferInsert = {
		id: CMSSiteConfigId,
		title: settings.name,
		description: settings.description,
	};

	if (siteIcon) {
		siteConfig.siteIcon = siteIcon;
	}

	try {
		const insert = await db
			.update(tsSiteConfig)
			.set(siteConfig)
			.where(eq(tsSiteConfig.id, CMSSiteConfigId))
			.returning({ id: tsSiteConfig.id })
			.get();

		if (insert) {
			console.log('Updated site settings');
		} else {
			console.error('Failed to update site settings');
		}
	} catch (error) {
		console.error('Failed to import site settings from WP-API: ', error);
	}
};
