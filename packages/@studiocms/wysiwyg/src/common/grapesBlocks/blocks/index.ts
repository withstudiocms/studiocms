import type { Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import basics from './basics.js';
import extras from './extras.js';
import forms from './forms.js';

export function loadBlocks(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	basics(editor, opts);
	extras(editor, opts);
	forms(editor, opts);
}

export default loadBlocks;
