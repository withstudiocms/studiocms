import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/internal_helpers',
		setupFiles: ['allure-vitest/setup'],
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
