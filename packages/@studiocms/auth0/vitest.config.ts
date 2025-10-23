import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@studiocms/auth0',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
