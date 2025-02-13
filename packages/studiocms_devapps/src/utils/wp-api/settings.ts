import path from 'node:path';
import { db, eq } from 'astro:db';
import { userProjectRoot } from 'virtual:studiocms-devapps/config';
import { CMSSiteConfigId } from 'studiocms/consts';
import { tsSiteConfig } from 'studiocms/sdk/tables';
import type { SiteSettings } from '../../schema/wp-api.js';
import { apiEndpoint, downloadPostImage } from './utils.js';

const ASTROPUBLICFOLDER = path.resolve(userProjectRoot, 'public');

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
