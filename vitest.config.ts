import { defineConfig } from 'vitest/config';

const projectsWithTests: { scope?: string; names: string[] }[] = [
	{
		scope: 'withstudiocms',
		names: [
			'auth-kit',
			'buildkit',
			'component-registry',
			'config-utils',
			'effect',
			'internal_helpers',
		],
	},
	{
		scope: 'studiocms',
		names: [
			'auth0',
			'devapps',
			'html',
			'cloudinary-image-service',
			'md',
			'mdx',
			'blog',
			'markdoc',
			'wysiwyg',
		],
	},
	{
		names: ['studiocms'],
	},
];

const projects = projectsWithTests.flatMap(({ scope, names }) =>
	scope
		? names.map((name) => `packages/@${scope}/${name}`)
		: names.map((name) => `packages/${name}`)
);

export default defineConfig({
	test: {
		projects,
		reporters: ['default', 'junit'],
		outputFile: {
			junit: './junit-report.xml',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'audit/**',
				'bundle-tests/**',
				'scripts/**',
				'playground/**',
				'archive/**',
				'knip.config.ts',
				'.github/**',
				'vitest.config.ts',
				'**/**/vitest.config.ts',
				'**/**/@withstudiocms/auth-kit/scripts/**',
				'**/**/scratchpad/**',
				'**/**/test/fixtures/**',
				'**/**/test/test-utils.ts',
				'**/**/runtime.ts',
				// This is a minified Script used by @studiocms/md that is being injected using an Astro Component
				'**/**/components/TinyMDE.astro',
				// Exclude files from runtime only paths
				'**/routes/**',
				'**/runtime/**',
				'**/dist/**',
				'**/studiocms/studiocms-cli.mjs',
				'**/db/config.ts',
				'**/virtuals/stubs/**',
				'**/virtuals/plugins/**',
				'**/virtuals/notifier/index.ts',
				'**/virtuals/mailer/index.ts',
				'**/virtuals/i18n/v-files.ts',
				'**/virtuals/auth/scripts/**',
				'**/virtuals/auth/core.ts',
				'**/virtuals/auth/index.ts',
				'**/virtuals/auth/verify-email.ts',
				'**/webVitals/dashboard-grid-items/**',
				'**/webVitals/pages/**',
				'**/studiocms/src/handlers/**',
			],
		},
	},
});
