import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/coverage/**',
				'**/*.d.ts',
				'**/vitest.config.ts',
				'**/routes/**', // Astro routes - test separately with E2E
			],
		},
	},
});
