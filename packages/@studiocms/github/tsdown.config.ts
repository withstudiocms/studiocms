import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	entry: 'src/**/*.ts',
	unbundle: true,
	deps: {
		neverBundle: [/^astro:/, /^studiocms/],
		skipNodeModulesBundle: true,
	},
});
