import { defineStudioCMSConfig } from '../../packages/studiocms/src';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	dateLocale: 'en-us',
	rendererConfig: {
		markedConfig: {
			highlighterConfig: {
				highlighter: 'disabled',
			},
		},
	},
	defaultFrontEndConfig: {
		favicon: '/favicon.svg',
		// htmlDefaultHead: [
		// 	{
		// 		tag: 'script',
		// 		attrs: {
		// 			src: 'https://analytics.studiocms.xyz/script.js',
		// 			'data-website-id': '23a84c25-40fd-4303-a191-aba4bfaf3ff1',
		// 			defer: true,
		// 		},
		// 	},
		// ],
	},
	includedIntegrations: {
		useAstroRobots: true,
		useInoxSitemap: true,
	},
	dashboardConfig: {
		AuthConfig: {
			enabled: true,
			providers: {
				auth0: false,
				discord: false,
				github: true,
				google: false,
				usernameAndPassword: true,
				usernameAndPasswordConfig: {
					allowUserRegistration: true,
				},
			},
		},
		dashboardEnabled: true,
		developerConfig: {
			viewTransitionAPI: false,
			testingAndDemoMode: false,
		},
	},
});
