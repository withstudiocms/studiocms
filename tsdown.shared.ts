import type { UserConfig } from 'tsdown';

/**
 * Shared configuration for tsdown across packages.
 */
export const sharedConfig: UserConfig = {
	format: 'esm',
	dts: {
		build: true,
	},
	checks: {
		pluginTimings: false,
	},
	outExtensions: () => ({
		js: '.js',
		dts: '.d.ts',
	}),
	copy: [
		{
			from: 'src/**/*.astro',
			to: 'dist',
			flatten: false,
		},
		{
			from: 'src/**/*.css',
			to: 'dist',
			flatten: false,
		},
		{
			from: 'src/**/*.d.ts',
			to: 'dist',
			flatten: false,
		},
	],
};

/**
 * Configuration to fix issues with virtual modules in tsdown.
 * This configuration disables unresolved import checks for virtual modules used in the project.
 * It is necessary to avoid false positives when using virtual modules like 'studiocms:blog/config' and 'studiocms:blog/frontend-config'.
 */
export const virtualModuleFix: UserConfig = {
	checks: {
		unresolvedImport: false,
	},
};

/**
 * Configuration to prevent bundling of dependencies in tsdown.
 * This configuration ensures that dependencies are not bundled, allowing for better modularity and easier debugging.
 * It is useful when working with external libraries or modules that should remain separate from the main bundle.
 */
export const noBundleConfig: UserConfig = {
	deps: {
		neverBundle: true,
	},
};
