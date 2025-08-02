import type { Editor, Plugin } from 'grapesjs';
import blocks from './blocks';
import commands from './commands';
import panels from './panels';

export type PluginOptions = {
	/**
	 * Which blocks to add.
	 * @default ['link-block', 'quote', 'text-basic']
	 */
	blocks?: string[];

	/**
	 * Add custom block options, based on block id.
	 * @default (blockId) => ({})
	 * @example (blockId) => blockId === 'quote' ? { attributes: {...} } : {};
	 */

	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	block?: (blockId: string) => {};

	/**
	 * Modal import title.
	 * @default 'Import'
	 */
	modalImportTitle?: string;

	/**
	 * Modal import button text.
	 * @default 'Import'
	 */
	modalImportButton?: string;

	/**
	 * Import description inside import modal.
	 * @default ''
	 */
	modalImportLabel?: string;

	/**
	 * Default content to setup on import model open.
	 * Could also be a function with a dynamic content return (must be a string).
	 * @default ''
	 * @example editor => editor.getHtml()
	 */
	modalImportContent?: string | ((editor: Editor) => string);

	/**
	 * Code viewer (eg. CodeMirror) options.
	 * @default {}
	 */

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	importViewerOptions?: Record<string, any>;

	/**
	 * Confirm text before clearing the canvas.
	 * @default 'Are you sure you want to clear the canvas?'
	 */
	textCleanCanvas?: string;

	/**
	 * Show the Style Manager on component change.
	 * @default true
	 */
	showStylesOnChange?: boolean;

	/**
	 * Load custom preset theme.
	 * @default true
	 */
	useCustomTheme?: boolean;
};

export type RequiredPluginOptions = Required<PluginOptions>;

const plugin: Plugin = (editor) => {
	const config: RequiredPluginOptions = {
		blocks: ['link-block', 'quote', 'text-basic'],
		block: () => ({}),
		modalImportTitle: 'Import',
		modalImportButton: 'Import',
		modalImportLabel: '',
		modalImportContent: '',
		importViewerOptions: {},
		textCleanCanvas: 'Are you sure you want to clear the canvas?',
		showStylesOnChange: true,
		useCustomTheme: true,
	};

	// if (config.useCustomTheme && typeof window !== 'undefined') {
	// 	const primaryColor = 'hsl(var(--background-step-3))';
	// 	const secondaryColor = 'hsl(var(--text-normal))';
	// 	const tertiaryColor = 'hsl(var(--background-step-1))';
	// 	const quaternaryColor = 'hsl(var(--primary-base))';
	// 	const prefix = 'gjs-';
	// 	let cssString = '';

	// 	// biome-ignore lint/complexity/noForEach: <explanation>
	// 	[
	// 		['one', primaryColor],
	// 		['two', secondaryColor],
	// 		['three', tertiaryColor],
	// 		['four', quaternaryColor],
	// 	].forEach(([cnum, ccol]) => {
	// 		cssString += `
	//     .${prefix}${cnum}-bg {
	//       background-color: ${ccol};
	//     }

	//     .${prefix}${cnum}-color {
	//       color: ${ccol};
	//     }

	//     .${prefix}${cnum}-color-h:hover {
	//       color: ${ccol};
	//     }
	//   `;
	// 	});

	// 	const style = document.createElement('style');
	// 	style.innerText = cssString;
	// 	document.head.appendChild(style);
	// }

	// Load blocks
	blocks(editor, config);

	// Load commands
	commands(editor, config);

	// Load panels
	panels(editor, config);
};

export default plugin;
