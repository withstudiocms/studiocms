import type { Plugin } from 'grapesjs';
import loadBlocks from './blocks.js';
import loadComponents from './components/index.js';
import defaultOptions from './options.js';
import type { TabsOptions } from './types.js';

export type PluginOptions = TabsOptions;

const plugin: Plugin<Partial<PluginOptions>> = (editor, opts = {}) => {
	const options = {
		...defaultOptions,
		...opts,
	};

	// Add components
	loadComponents(editor, options);

	// Add blocks
	loadBlocks(editor, options);
};

export default plugin;
