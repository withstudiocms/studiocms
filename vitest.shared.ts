import { defineProject } from 'vitest/config';

/**
 * Shared Vitest project configuration used across the repository.
 *
 * This constant defines common test settings to be applied to projects created
 * with `defineProject`. It ensures:
 * - `setupFiles` includes the Allure setup module ('allure-vitest/setup')
 *   so Allure reporting is initialized before tests run.
 * - `environment` is set to `'node'` so tests execute in a Node.js environment.
 *
 * Intended to be extended or merged into per-project configurations to keep
 * test setup consistent across multiple projects.
 *
 * @constant
 */
export const configShared = defineProject({
	test: {
		setupFiles: ['allure-vitest/setup'],
		environment: 'node',
	},
});
