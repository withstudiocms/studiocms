import { StudioCMSRoutes } from 'studiocms/lib/routeMap';

export const parentSuiteName = '@studiocms/blog Package Tests';
export const sharedTags = ['package:@studiocms/blog', 'type:unit', 'scope:studiocms'];

export const MockAstroLocals = (): App.Locals => {
	const date = new Date();
	return {
		StudioCMS: {
			siteConfig: {
				id: 'SCMS_SITE_CONFIG_1',
				data: {
					title: 'Test Site',
					description: 'A test site for StudioCMS',
					defaultOgImage: 'https://example.com/default-og-image.png',
					diffPerPage: 10,
					enableDiffs: false,
					enableMailer: false,
					gridItems: [],
					hideDefaultIndex: false,
					loginPageBackground: 'studiocms-curves',
					loginPageCustomImage: null,
					siteIcon: null,
					_config_version: '1.0.0',
				},
			},
			defaultLang: 'en',
			latestVersion: {
				lastCacheUpdate: date,
				version: '0.0.0-test',
			},
			SCMSGenerator: 'StudioCMS v0.0.0-test',
			SCMSUiGenerator: 'StudioCMS UI v0.0.0-test',
			routeMap: StudioCMSRoutes,
		},
	};
};
