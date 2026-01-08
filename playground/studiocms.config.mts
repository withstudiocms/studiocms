import blog from '@studiocms/blog';
import md from '@studiocms/md';
import s3Storage from '@studiocms/s3-storage';
import wysiwyg from '@studiocms/wysiwyg';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	plugins: [md(), blog(), wysiwyg()],
	storageManager: s3Storage(),
	features: {
		webVitals: false,
		developerConfig: {
			demoMode: false,
		},
	},
	componentRegistry: {
		testcomp: './src/components/test-comp.astro',
	},
});
