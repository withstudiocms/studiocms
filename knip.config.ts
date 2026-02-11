import type { KnipConfig } from 'knip';

/**
 * Configuration object for Astro workspace file selection patterns.
 *
 * @property entry - Glob patterns specifying entry files for the workspace, including various JavaScript and TypeScript extensions.
 * @property project - Glob patterns specifying project files for the workspace, including various JavaScript and TypeScript extensions.
 * @property astro - Nested configuration for Astro-specific files.
 * @property astro.entry - Glob patterns specifying entry `.astro` files within the `src` directory.
 * @property astro.project - Glob patterns specifying project `.astro` files within the `src` directory.
 */
const baseAstroWorkspaceConfig = {
	entry: [
		'src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}',
		'frontend/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}',
	],
	project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
	ignore: ['**/node_modules/**', '**/dist/**', '**/scratchpad/**'],
	astro: {
		entry: ['src/**/*.astro', 'frontend/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}'],
		project: ['src/**/*.astro', 'frontend/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}'],
	},
};

/**
 * Configuration object for non-Astro workspace file selection patterns.
 *
 * @property entry - Glob patterns specifying entry files for the workspace, including various JavaScript and TypeScript extensions.
 * @property project - Glob patterns specifying project files for the workspace, including various JavaScript and TypeScript extensions.
 * @property ignore - Glob patterns specifying files or directories to ignore in the workspace.
 */
const baseWithStudioCMSConfig = {
	entry: [
		'src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}',
		'test/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}',
	],
	project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,astro}'],
	ignore: ['**/node_modules/**', '**/dist/**', '**/scratchpad/**', '**/example.config.mjs'],
};
const buildKitWithStudioCMSConfig = {
	...baseWithStudioCMSConfig,
	entry: ['lib/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}', 'test/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
};

/**
 * An array of package names used within the StudioCMS project that are not part of the `@studiocms` namespace.
 *
 * @remarks
 * This constant is defined as a readonly tuple using `as const` to ensure
 * that the package names are immutable and their types are preserved.
 *
 * @example
 * ```typescript
 * atStudioCMSPackages.includes('blog'); // true
 * ```
 */
const atStudioCMSPackages = [
	'auth0',
	'blog',
	'cloudinary-image-service',
	'devapps',
	'discord',
	'github',
	'google',
	'markdoc',
	'mdx',
	'md',
	'html',
	'wysiwyg',
	'migrator',
	's3-storage',
	'upgrade',
] as const;

/**
 * An array of package names used within the StudioCMS project that are not part of the `@withstudiocms` namespace.
 *
 * @remarks
 * This constant is defined as a readonly tuple using `as const` to ensure
 * that the package names are immutable and their types are preserved.
 *
 * @example
 * ```typescript
 * atWithStudioCMSPackages.includes('config-utils'); // true
 * ```
 */
const atWithStudioCMSPackages = [
	'api-spec',
	'auth-kit',
	'config-utils',
	'effect',
	'component-registry',
	'internal_helpers',
	'template-lang',
	'kysely',
	'sdk',
	'cli-kit',
] as const;

const bundleTestPackages = ['studiocms-blog', 'studiocms-headless'] as const;

const studiocmsVirtualIgnore = [
	'auth0',
	'blog',
	'devapps',
	'discord',
	'google',
	'github',
	'html',
	'md',
	'mdx',
	'wysiwyg',
] as const;

const astroVirtualIgnore = [
	'cloudinary-image-service',
	'auth0',
	'discord',
	'google',
	'github',
] as const;

const ignoredVirtuals = (() => {
	const entries: Record<string, { ignoreDependencies: (string | RegExp)[] }> = {};

	function addOrAppend(pkg: string, ignore: string | RegExp) {
		if (!entries[pkg]) {
			entries[pkg] = { ignoreDependencies: [ignore] };
		} else if (!entries[pkg].ignoreDependencies.includes(ignore)) {
			entries[pkg].ignoreDependencies.push(ignore);
		}
	}

	studiocmsVirtualIgnore.forEach((pkg) => {
		addOrAppend(pkg, /studiocms:.*/);
	});
	astroVirtualIgnore.forEach((pkg) => {
		addOrAppend(pkg, /astro:.*/);
	});

	return entries;
})();

/**
 * Returns additional configuration options for a given package, such as dependencies to ignore.
 *
 * @param pkg - The name of the package to retrieve extras for.
 * @returns An object containing extra configuration for the package, such as `ignoreDependencies`,
 *          or an empty object if no extras are defined for the package.
 */
const extras = (pkg: string) => {
	const extrasMap: Record<
		string,
		{
			ignoreDependencies?: (string | RegExp)[] | undefined;
			entry?: string[] | undefined;
			ignoreUnresolved?: (string | RegExp)[] | undefined;
			ignore?: string[] | undefined;
			ignoreBinaries?: (string | RegExp)[] | undefined;
		}
	> = {
		markdoc: {
			ignoreDependencies: ['react-dom', '@types/react-dom', /studiocms:.*/],
			ignore: ['**/test/test-utils.ts'],
		},
		'auth-kit': {
			ignoreUnresolved: [/^\.\/lists\/[^/]*\.js$/],
		},
		kysely: {
			ignore: ['**/node_modules/**', '**/dist/**', '**/scratchpad/**', '**/migrations/**'],
			ignoreDependencies: ['@libsql/client'],
		},
		migrator: {
			ignoreDependencies: ['sharp'],
		},
		'api-spec': {
			ignoreBinaries: ['tsx'],
		},
		...ignoredVirtuals,
	};
	const supportsExtras = Object.keys(extrasMap).includes(pkg);
	return supportsExtras ? extrasMap[pkg] : {};
};

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	workspaces: {
		'.': {
			ignoreDependencies: [
				'@changesets/config',
				'studiocms',
				'vite',
				'allure-js-commons',
				'@studiocms/migrator',
			],
			ignoreBinaries: [/ci:.*$/, /bundle-test:.*$/],
			entry: ['.github/workflows/*.yml', '.github/scripts/**/*.mjs', 'scripts/**/*.mjs'],
			project: ['.github/scripts/**/*.mjs', 'scripts/**/*.mjs'],
			ignore: [
				'**/node_modules/**',
				'**/dist/**',
				'**/scratchpad/**',
				'**/archive/**',
				'**/templates/**',
			],
		},
		'packages/studiocms': {
			...baseAstroWorkspaceConfig,
			ignoreDependencies: ['studiocms-dashboard', '@it-astro', /studiocms:.*/, /astro:.*/],
		},
		'packages/create-studiocms': {
			...baseWithStudioCMSConfig,
		},
		'packages/effectify': {
			...baseWithStudioCMSConfig,
			ignoreBinaries: ['tsx'],
		},
		...atStudioCMSPackages.reduce(
			(acc, pkg) => {
				acc[`packages/@studiocms/${pkg}`] = {
					...baseAstroWorkspaceConfig,
					...extras(pkg),
				};
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic object construction
			{} as Record<string, any>
		),
		...atWithStudioCMSPackages.reduce(
			(acc, pkg) => {
				acc[`packages/@withstudiocms/${pkg}`] = {
					...baseWithStudioCMSConfig,
					...extras(pkg),
				};
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic object construction
			{} as Record<string, any>
		),
		...bundleTestPackages.reduce(
			(acc, pkg) => {
				acc[`bundle-tests/${pkg}`] = {
					ignoreDependencies: ['sharp', '@libsql/client', 'kysely-turso'],
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
				};
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic object construction
			{} as Record<string, any>
		),
		'packages/@withstudiocms/build-kit': buildKitWithStudioCMSConfig,
		'packages/@withstudiocms/*/test/fixtures/*': {
			ignore: ['**/*'],
		},
		'packages/@studiocms/*/test/fixtures/*': {
			ignore: ['**/*'],
		},
		playground: {
			ignoreDependencies: ['sharp', '@libsql/client', 'kysely-turso'],
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
