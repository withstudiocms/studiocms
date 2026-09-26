import { defineConfig } from 'tsdown';
import { sharedConfig } from '../../../tsdown.shared.ts';

export default defineConfig({
	...sharedConfig,
	unbundle: true,
	entry: 'src/**/**.ts',
	copy: [
		{ from: 'src/styles/**/*.css', to: 'dist', flatten: false },
		{ from: 'src/**/*.d.ts', to: 'dist', flatten: false },
	],
	deps: {
		neverBundle: [/^studiocms:markdown-remark/],
		onlyBundle: ['@types/hast', '@types/mdast', '@types/unist'],
	},
});
