import blog from '@studiocms/blog';
import md from '@studiocms/md';
import { defineStudioCMSConfig } from 'studiocms/config';

export default defineStudioCMSConfig({
	dbStartPage: false,
	plugins: [md(), blog()],
});
