import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	entry: 'src/**/*.ts',
	unbundle: true,
	deps: {
		neverBundle: [/^astro:/, /^studiocms/, /^ultrahtml/],
		skipNodeModulesBundle: true,
	},
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
});
