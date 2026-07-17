import html from '@studiocms/html';
import md from '@studiocms/md';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: true,
	db: {
		dialect: 'postgres',
	},
	plugins: [md(), html()],
});
