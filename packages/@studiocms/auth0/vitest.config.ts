import { defineProject, mergeConfig } from 'vitest/config';
import { configShared } from '../../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		test: {
			name: '@studiocms/auth0',
			include: ['**/*.test.ts'],
		},
	})
);
