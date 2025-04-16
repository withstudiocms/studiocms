import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	ignoreBinaries: ['db:push', 'preview'],
	workspaces: {
		'.': {
			ignoreDependencies: ['@changesets/config'],
			entry: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
			project: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
		},
		'build-scripts': {
			entry: '{index,cli}.js',
			project: '**/*.js',
		},
		'packages/studiocms': {
			ignoreDependencies: [
				'@clack/core',
				'@commander-js/extra-typings',
				'studiocms-dashboard',
				'commander',
			],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/studiocms_blog': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/studiocms_devapps': {
			ignoreDependencies: ['@types/cheerio'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/studiocms_markdoc': {
			ignoreDependencies: ['react-dom', '@types/react-dom'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/studiocms_mdx': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		playground: {
			ignoreDependencies: ['sharp'],
			astro: {
				entry: [
					'studiocms.config.{js,cjs,mjs,ts,mts}',
					'astro.config.{js,cjs,mjs,ts,mts}',
					'src/content/config.ts',
					'src/content.config.ts',
					'src/components/**/*.{astro,js,ts}',
					'src/pages/**/*.{astro,mdx,js,ts}',
					'src/content/**/*.mdx',
					'src/middleware.{js,ts}',
					'src/actions/index.{js,ts}',
				],
			},
		},
	},
};

export default config;
