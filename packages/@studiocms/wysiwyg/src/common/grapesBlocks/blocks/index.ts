import type { Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import basics from './basics.js';
import extras from './extras.js';
import forms from './forms.js';
import tabs from './tabs.js';

export function loadBlocks(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	basics(editor, opts);
	extras(editor, opts);
	forms(editor, opts);
	tabs(editor, opts);
}

export default loadBlocks;
