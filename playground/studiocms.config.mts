import blog from '@studiocms/blog';
import md from '@studiocms/md';
import wysiwyg from '@studiocms/wysiwyg';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	plugins: [md(), blog(), wysiwyg()],
	features: {
		webVitals: false,
		developerConfig: {
			demoMode: false,
		},
	},
	componentRegistry: {
		testcomp: './src/components/test-comp.astro',
		'test-comp': './src/components/test-comp.astro',
	},
});
