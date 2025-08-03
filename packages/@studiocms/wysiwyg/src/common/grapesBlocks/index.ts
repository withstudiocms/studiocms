import type { Plugin } from 'grapesjs';
import loadBlocks from './blocks/index.js';
import loadCommands from './commands/index.js';
import loadComponents from './components/index.js';
import { defaultGrapesBlocksOptions } from './consts.js';
import loadI18n from './i18n/index.js';
import loadPanels from './panels/index.js';
import loadRichTextEditor from './rte/index.js';
import loadSelectors from './selectors/index.js';
import loadTraits from './traits/index.js';
import loadTuiImageEditor from './tuiImageEditor/index.js';
import type { GrapesBlocksOptions, RequiredGrapesBlocksOptions } from './types.js';

const grapesBlocks: Plugin<Partial<GrapesBlocksOptions>> = (editor, opts = {}) => {
	// Ensure the options are complete
	const options: RequiredGrapesBlocksOptions = {
		...defaultGrapesBlocksOptions,
		...opts,
	};

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
