import blog from '@studiocms/blog';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	dashboardConfig: {
		AuthConfig: {
			providers: {
				github: true,
				google: true,
				auth0: true,
				discord: true,
			},
		},
	},
	plugins: [blog()],
});
