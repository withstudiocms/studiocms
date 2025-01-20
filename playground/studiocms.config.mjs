import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	verbose: true,
	defaultFrontEndConfig: {
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
});
