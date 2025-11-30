import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	features: {
		developerConfig: {
			demoMode: false,
		},
	},
	componentRegistry: {
		'test-comp': './src/components/test-comp.astro',
	},
});
