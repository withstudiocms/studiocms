import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: 'src/**/*.ts',
	treeshake: true,
	unbundle: true,
	checks: {
		pluginTimings: false,
	},
});
