import blog from '@studiocms/blog';
import md from '@studiocms/md';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: true,
	db: {
		dialect: 'mysql',
	},
	plugins: [md(), blog()],
});
