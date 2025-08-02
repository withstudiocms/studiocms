import type { BlockProperties, ComponentDefinition, Plugin } from 'grapesjs';
import loadBlocks from './blocks.js';
import loadComponents from './components.js';
import loadTraits from './traits.js';

export interface PluginOptions {
	/**
	 * Library to load asynchronously in case `Typed` is not found.
	 * @default 'https://cdn.jsdelivr.net/npm/typed.js@2.0.11'
	 */
	script?: string;

	/**
	 * Object to extend the default block, eg. `{ label: 'Typed', ... }`.
	 * Pass a falsy value to avoid adding the block
	 * @default {}
	 */
	block?: Partial<BlockProperties>;

	/**
	 * Customize the component props. The final object should be returned.
	 * @default (props) => props
	 * @example
	 * props: props => {
	 *    props.traits = props.traits.map(trait => {
	 *      if (trait.name == 'strings') {
	 *        trait.label = 'Custom <b>trait<b/> label';
	 *      }
	 *      // this trait will be removed
	 *      if (trait.name == 'fade-out-class') return;
	 *      return trait;
	 *    }).filter(Boolean);
	 *
	 *    return props;
	 * }
	 */
	props?: (p: ComponentDefinition) => ComponentDefinition;
}

export type RequiredPluginOptions = Required<PluginOptions>;

const plugin: Plugin<PluginOptions> = (editor, opts: Partial<PluginOptions> = {}) => {
	const options: RequiredPluginOptions = {
		script: 'https://cdn.jsdelivr.net/npm/typed.js@2.0.11',
		block: {},
		props: (p) => p,
		...opts,
	};

	loadComponents(editor, options);
	loadBlocks(editor, options);
	loadTraits(editor);
};

export default plugin;
