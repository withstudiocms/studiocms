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
	entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
	project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
	astro: {
		entry: ['src/**/*.astro'],
		project: ['src/**/*.astro'],
	},
};

/**
 * An array of package names used within the StudioCMS project.
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
	'blog',
	'cloudinary-image-service',
	'devapps',
	'markdoc',
	'mdx',
	'md',
	'html',
] as const;

const atWithStudioCMSPackages = [
	'config-utils',
] as const;

/**
 * Returns additional configuration options for a given package, such as dependencies to ignore.
 *
 * @param pkg - The name of the package to retrieve extras for.
 * @returns An object containing extra configuration for the package, such as `ignoreDependencies`,
 *          or an empty object if no extras are defined for the package.
 */
const extras = (pkg: string) => {
	const extrasMap: Record<string, { ignoreDependencies?: (string | RegExp)[] | undefined }> = {
		markdoc: {
			ignoreDependencies: ['react-dom', '@types/react-dom'],
		},
	};
	const supportsExtras = Object.keys(extrasMap).includes(pkg);
	return supportsExtras ? extrasMap[pkg] : {};
};

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	workspaces: {
		'.': {
			ignoreDependencies: ['@changesets/config'],
			entry: ['.github/workflows/*.yml', 'scripts/*.mjs'],
			project: ['scripts/*.mjs'],
		},
		'packages/studiocms': {
			...baseAstroWorkspaceConfig,
			ignoreDependencies: [
				'@clack/core',
				'studiocms-dashboard',
				'@effect/experimental',
				'@effect/typeclass',
				'@effect/workflow',
			],
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
		'packages/@withstudiocms/buildkit': {
			project: '**/*.js',
		},
		...atWithStudioCMSPackages.reduce(
			(acc, pkg) => {
				acc[`packages/@withstudiocms/${pkg}`] = {
					...baseAstroWorkspaceConfig,
				};
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: This is a dynamic object construction
			{} as Record<string, any>
		),
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
