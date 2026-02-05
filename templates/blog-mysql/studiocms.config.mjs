import { defineStudioCMSConfig } from 'studiocms/config';
import blog from '@studiocms/blog';
import md from '@studiocms/md';

export default defineStudioCMSConfig({
	dbStartPage: true,
	db: {
		dialect: 'mysql',
	},
	plugins: [md(), blog()],
});
