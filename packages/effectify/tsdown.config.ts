import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/**/*.ts',
	clean: false,
	treeshake: true,
	unbundle: true,
	format: ['esm'],
	dts: true,
	checks: {
		pluginTimings: false,
	},
});
