import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/internal_helpers',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
