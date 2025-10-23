import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@studiocms/google',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
