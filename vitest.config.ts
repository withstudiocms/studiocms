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
		names: ['devapps', 'html', 'cloudinary-image-service', 'md', 'mdx', 'blog', 'markdoc'],
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
			reporter: ['text', 'json'],
			exclude: [
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
			],
		},
	},
});
