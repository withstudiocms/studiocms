import { defineStudioCMSConfig } from 'studiocms/config';
import md from '@studiocms/md';
import html from '@studiocms/html';

// import github from '@studiocms/github'; 

// Uncomment or install other providers and add to the plugins array below if you want to use GitHub authentication

export default defineStudioCMSConfig({
	dbStartPage: true,
	db: {
		dialect: 'postgres',
	},
	plugins: [md(), html()],
});
