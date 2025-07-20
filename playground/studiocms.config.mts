import blog from '@studiocms/blog';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	logLevel: "All",
	plugins: [blog()],
	features: {
		developerConfig: {
			demoMode: false,
		},
	},
	componentRegistry: {
		'test-comp': './src/components/test-comp.astro',
	},
});
