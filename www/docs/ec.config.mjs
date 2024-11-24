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
					strict: true,
					moduleResolution: 100,
					target: ts.ScriptTarget.ES2022,
					exactOptionalPropertyTypes: true,
					downlevelIteration: true,
					skipLibCheck: true,
					lib: ['ES2022', 'DOM', 'DOM.Iterable'],
					noEmit: true,
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
