import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	workspaces: {
		'.': {
			ignoreDependencies: ['@changesets/config'],
			entry: ['.github/workflows/*.yml', 'scripts/*.mjs'],
			project: ['scripts/*.mjs'],
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
		'packages/@studiocms/blog': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/cloudinary-image-service': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/devapps': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/markdoc': {
			ignoreDependencies: ['react-dom', '@types/react-dom'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/mdx': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/md': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/@studiocms/html': {
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
