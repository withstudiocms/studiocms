import type { BlockProperties, Plugin } from 'grapesjs';
import loadBlocks from './blocks.js';
import loadComponents from './components.js';
import loadTraits from './traits.js';

export type PluginOptions = {
	/**
	 * Which blocks to add.
	 * @default ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio']
	 */
	blocks?: string[];

	/**
	 * Category name for blocks.
	 * @default 'Forms'
	 */
	category?: BlockProperties['category'];

	/**
	 * Add custom block options, based on block id.
	 * @default (blockId) => ({})
	 * @example (blockId) => blockId === 'input' ? { attributes: {...} } : {};
	 */

	// biome-ignore lint/complexity/noBannedTypes: This is the type that was already used in the original code
	block?: (blockId: string) => {};
};

const plugin: Plugin<PluginOptions> = (editor, opts = {}) => {
	const config: Required<PluginOptions> = {
		blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio'],
		category: { id: 'forms', label: 'Forms' },
		block: () => ({}),
		...opts,
	};

	loadComponents(editor);
	loadTraits(editor);
	loadBlocks(editor, config);
};

export default plugin;
