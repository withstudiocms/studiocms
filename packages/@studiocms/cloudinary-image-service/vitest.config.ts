import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@studiocms/cloudinary-image-service',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
