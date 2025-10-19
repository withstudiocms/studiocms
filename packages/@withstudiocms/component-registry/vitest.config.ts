import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/component-registry',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
