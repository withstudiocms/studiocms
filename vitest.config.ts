import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: ['packages/*', 'packages/@withstudiocms/*', 'packages/@studiocms/*'],
		reporters: ['default', 'junit'],
		outputFile: {
			junit: './junit-report.xml',
		},
		coverage: {
			provider: 'v8',
		},
	},
});
