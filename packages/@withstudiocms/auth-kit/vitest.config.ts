import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/auth-kit',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
