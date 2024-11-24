import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import ecTwoSlash from 'expressive-code-twoslash';

export default defineEcConfig({
	shiki: {
		transformers: [transformerColorizedBrackets()],
	},
	themes: ['dark-plus', 'light-plus'],
	plugins: [
		ecTwoSlash({
			twoslashOptions: {
				compilerOptions: {
					moduleResolution: 100,
				},
			},
		}),
	],
	styleOverrides: {
		// @ts-expect-error - This is not a Standard EC config option, but it's a valid one from a plugin
		twoSlash: {
			cursorColor: '#f8f8f2',
		},
	},
});
