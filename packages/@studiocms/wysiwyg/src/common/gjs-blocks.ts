import { deepmerge } from 'deepmerge-ts';
import type { Plugin } from 'grapesjs';
import loadBlocks from './grapesBlocks/blocks/index.js';
import loadCommands from './grapesBlocks/commands/index.js';
import loadComponents from './grapesBlocks/components/index.js';
import { defaultGrapesBlocksOptions } from './grapesBlocks/consts.js';
import loadI18n from './grapesBlocks/i18n/index.js';
import loadPanels from './grapesBlocks/panels/index.js';
import loadRichTextEditor from './grapesBlocks/rte/index.js';
import loadSelectors from './grapesBlocks/selectors/index.js';
import loadTraits from './grapesBlocks/traits/index.js';
import loadTuiImageEditor from './grapesBlocks/tuiImageEditor/index.js';
import type { GrapesBlocksOptions, RequiredGrapesBlocksOptions } from './grapesBlocks/types.js';

const grapesBlocks: Plugin<Partial<GrapesBlocksOptions>> = (editor, opts = {}) => {
	// Ensure the options are complete
	const options: RequiredGrapesBlocksOptions = deepmerge(defaultGrapesBlocksOptions, opts);

	// Load the various components of the plugin
	loadComponents(editor, options);
	loadBlocks(editor, options);
	loadCommands(editor, options);
	loadPanels(editor, options);
	loadSelectors(editor, options);
	loadTraits(editor);
	loadI18n(editor);

	// Load the rich text editor plugin
	loadRichTextEditor(editor, options.rteOpts);

	// Load TUI Image Editor
	loadTuiImageEditor(editor);
};

export default grapesBlocks;
