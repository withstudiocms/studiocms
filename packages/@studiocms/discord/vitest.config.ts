import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@studiocms/discord',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
