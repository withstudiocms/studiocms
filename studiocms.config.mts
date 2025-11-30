import { defineStudioCMSConfig } from 'studiocms/config';

// This file is here for testing/dev of the `@studiocms/migrator` package

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
