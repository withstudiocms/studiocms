import {
	transformerMetaHighlight,
	transformerMetaWordHighlight,
	transformerNotationDiff,
	transformerNotationErrorLevel,
	transformerNotationHighlight,
	transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { rendererRich, transformerTwoslash } from '@shikijs/twoslash';
import type { ShikiTransformer } from 'shiki';
import { transformerColorHighlight } from 'shiki-transformer-color-highlight';
import colorizedBrackets from './transformers/colorizedBrackets';
import addCopyButton from './transformers/copyButton';
import metaTitle from './transformers/metaTitle';
import { renderMarkdown, renderMarkdownInline } from './twoslashRenderers';

export { default as metaTitle } from './transformers/metaTitle';
export { default as colorizedBrackets } from './transformers/colorizedBrackets';
export { default as addCopyButton } from './transformers/copyButton';

export const transformerKit: ShikiTransformer[] = [
	addCopyButton(),
	colorizedBrackets(),
	metaTitle(),
	transformerColorHighlight(),
	transformerMetaHighlight(),
	transformerMetaWordHighlight(),
	transformerNotationDiff(),
	transformerNotationHighlight(),
	transformerNotationWordHighlight(),
	transformerNotationErrorLevel(),
	transformerTwoslash({
		renderer: rendererRich({
			renderMarkdown,
			renderMarkdownInline,
		}),
		explicitTrigger: true,
		twoslashOptions: {
			compilerOptions: {
				// Set module resolution to "Bundler"
				moduleResolution: 100,
			},
		},
	}),
];
