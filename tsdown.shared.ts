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
	treeshake: true,
	outExtensions: () => ({
		js: '.js',
		dts: '.d.ts',
	}),
};
