import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/template-lang',
		setupFiles: ['allure-vitest/setup'],
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
