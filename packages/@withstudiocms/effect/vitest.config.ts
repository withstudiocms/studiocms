import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/effect',
		environment: 'node',
		include: ['**/*.test.ts'],
	},
});
