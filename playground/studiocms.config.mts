import blog from '@studiocms/blog';
import md from '@studiocms/md';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	plugins: [md(), blog()],
	features: {
		developerConfig: {
			demoMode: false,
		},
	},
	componentRegistry: {
		'test-comp': './src/components/test-comp.astro',
	},
});
