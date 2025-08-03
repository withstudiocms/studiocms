import type { Plugin } from 'grapesjs';
import loadBlocks from './blocks/index.js';
import loadCommands from './commands/index.js';
import loadComponents from './components/index.js';
import { loadI18n } from './i18n/index.js';
import loadPanels from './panels/index.js';
import richTextEditor from './rte/index.js';
import loadSelectors from './selectors/index.js';
import loadTraits from './traits/index.js';
import tuiImageEditor from './tuiImageEditor/index.js';
import type { GrapesBlocksOptions, RequiredGrapesBlocksOptions } from './types.js';

const grapesBlocks: Plugin<Partial<GrapesBlocksOptions>> = (editor, opts = {}) => {
	// Ensure the options are complete
	const options: RequiredGrapesBlocksOptions = {
		blocks: ['link-block', 'quote', 'text-basic', 'tooltip', 'typed', 'column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video', 'map'],
		block: () => ({}),
		modalImportTitle: 'Import',
		modalImportButton: 'Import',
		modalImportLabel: '',
		modalImportContent: '',
		importViewerOptions: {},
		textCleanCanvas: 'Are you sure you want to clear the canvas?',
		showStylesOnChange: true,
		flexGrid: true,
		stylePrefix: 'gjs-',
		addBasicStyle: true,
		labelColumn1: '1 Column',
		labelColumn2: '2 Columns',
		labelColumn3: '3 Columns',
		labelColumn37: '2 Columns 3/7',
		labelText: 'Text',
		labelLink: 'Link',
		labelImage: 'Image',
		labelVideo: 'Video',
		labelMap: 'Map',
		rowHeight: 75,
		tooltip: {
			id: 'tooltip',
			labelTooltip: 'Tooltip',
			blockTooltip: {},
			propsTooltip: {},
			extendTraits: (traits) => traits,
			attrTooltip: 'data-tooltip',
			classTooltip: 'tooltip-component',
			style: '',
			styleAdditional: '',
			privateClasses: true,
			stylableTooltip: [
				'background-color',
				'padding',
				'padding-top',
				'padding-right',
				'padding-bottom',
				'padding-left',
				'font-family',
				'font-size',
				'font-weight',
				'letter-spacing',
				'color',
				'line-height',
				'text-align',
				'border-radius',
				'border-top-left-radius',
				'border-top-right-radius',
				'border-bottom-left-radius',
				'border-bottom-right-radius',
				'border',
				'border-width',
				'border-style',
				'border-color',
			],
			showTooltipOnStyle: true,
		},
		typed: {
			script: 'https://cdn.jsdelivr.net/npm/typed.js@2.0.11',
			block: {},
			props: (p) => p,
		},
		rteOpts: {},
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
	richTextEditor(editor, options.rteOpts);

	// Load TUI Image Editor
	tuiImageEditor(editor);
};

export default grapesBlocks;
