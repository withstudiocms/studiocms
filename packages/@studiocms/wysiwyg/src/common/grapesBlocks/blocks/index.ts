import type { BlockProperties, Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions } from '../types.js';
import basics from './basics.js';
import extras from './extras.js';
import forms from './forms.js';
import tabs from './tabs.js';

export const AddBlocks = (editor: Editor, opts: RequiredGrapesBlocksOptions) => 
	(id: string, def: BlockProperties) => {
		opts.blocks.indexOf(id) >= 0 &&
			editor.Blocks.add(id, {
				select: true,
				...def,
				...opts.block(id),
			});
	};

export function loadBlocks(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	basics(editor, opts);
	extras(editor, opts);
	forms(editor, opts);
	tabs(editor, opts);
}

export default loadBlocks;
