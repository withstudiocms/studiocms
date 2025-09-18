import { StudioCMSRoutes } from '../src/virtuals/lib/routeMap';

export function cleanAstroAttributes(str: string, mockPath: string) {
	const regex1 = /\s*data-astro-[a-zA-Z0-9-]*(?:="[^"]*")?/g;
	const regex1_replacement = '';
	const regex2 = /src="[^"?]*(\?[^"]*)"/g;
	const regex2_replacement = (_: string, p1: string) => `src="${mockPath}${p1}"`;
	const regex3 = /(<meta name="generator" content="Astro v)[0-9]+\.[0-9]+\.[0-9]+(")/g;
	const regex3_replacement = '$10.0.0-test$2';
	const regex4 = /(<img[^>]*href=)[^&"]*(&[^>]*>|"[^>]*>)/g;
	const regex4_replacement = '$1%2Fmock%2Fpath%2Fimage.webp$2';

	return str
		.replace(regex1, regex1_replacement)
		.replace(regex2, regex2_replacement)
		.replace(regex3, regex3_replacement)
		.replace(regex4, regex4_replacement);
}

export const makeRendererProps = (content: string | null) => ({
	data: {
		package: 'mock/render',
		defaultContent: {
			contentLang: 'default',
			contentId: 'mocked',
			id: 'mocked',
			content,
		},
	},
});

export const MockAstroLocals = () => {
	const date = new Date();
	return {
		StudioCMS: {
			siteConfig: {
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
				lastCacheUpdate: date,
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
