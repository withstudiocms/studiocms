import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		test: {
			name: '@withstudiocms/cli-kit',
			include: ['**/*.test.ts'],
		},
	})
);
