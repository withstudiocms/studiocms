import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	entry: 'src/**/*.ts',
	unbundle: true,
	deps: {
		skipNodeModulesBundle: true,
	},
	dts: {
		build: false, // We use tsc for .d.ts generation to avoid type collapsing issues with complex types
	},
});
