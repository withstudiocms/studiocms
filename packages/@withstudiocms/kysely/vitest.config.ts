import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		test: {
			name: '@withstudiocms/kysely',
			include: ['**/*.test.ts'],
		},
	})
);
