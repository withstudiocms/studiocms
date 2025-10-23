import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@studiocms/github',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
