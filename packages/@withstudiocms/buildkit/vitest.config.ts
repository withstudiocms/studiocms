import { defineProject } from 'vitest/config';

export default defineProject({
	test: {
		name: '@withstudiocms/buildkit',
		environment: 'node',
		include: ['**/*.test.js'],
	},
});
