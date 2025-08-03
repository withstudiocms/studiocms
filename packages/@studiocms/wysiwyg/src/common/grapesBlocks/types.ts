import type { BlockProperties, ComponentDefinition, Editor } from "grapesjs";

type TraitsProperty = ComponentDefinition['traits'];

type BlockList = string[];

export type TooltipOptions = {
	/**
	 * The ID used to create tooltip block and component
	 * @default 'tooltip'
	 */
	id?: string;

	/**
	 * The ID used to create tooltip block and component
	 * @default 'Tooltip'
	 */
	labelTooltip?: string;

	/**
	 * Object to extend the default tooltip block. Pass a falsy value to avoid adding the block.
	 * @example
	 * { label: 'Tooltip', category: 'Extra', ... }
	 */
	blockTooltip?: Partial<BlockProperties>;

	/**
	 * Object to extend the default tooltip properties.
	 * @example
	 * { name: 'Tooltip', droppable: false, ... }
	 */
	propsTooltip?: ComponentDefinition;

	/**
	 * A function which allows to extend default traits by receiving the original array and returning a new one.
	 */
	extendTraits?: (traits: TraitsProperty) => TraitsProperty;

	/**
	 * Tooltip attribute prefix.
	 * @default 'data-tooltip'
	 */
	attrTooltip?: string;

	/**
	 * Tooltip class prefix.
	 * @default 'tooltip-component'
	 */
	classTooltip?: string;

	/**
	 * Custom CSS styles for the tooltip component, this will replace the default one.
	 * @default 'tooltip-component'
	 */
	style?: string;

	/**
	 * Additional CSS styles for the tooltip component.
	 * @default 'tooltip-component'
	 */
	styleAdditional?: string;

	/**
	 * Make all tooltip relative classes private.
	 * @default true
	 */
	privateClasses?: boolean;

	/**
	 * Indicate if the tooltip can be styled.
	 * You can pass an array of which properties can be styled.
	 * @example ['color', 'background-color']
	 */
	stylableTooltip?: string[] | boolean;

	/**
	 * If true, force the tooltip to be shown when the default "Style tooltip" trait button is clicked.
	 * @default true
	 */
	showTooltipOnStyle?: boolean;
};

export interface TypedOptions {
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

export interface GrapesBlocksOptions {
	blocks: BlockList;

	/**
	 * Add custom block options, based on block id.
	 * @default (blockId) => ({})
	 * @example (blockId) => blockId === 'quote' ? { attributes: {...} } : {};
	 */

	// biome-ignore lint/complexity/noBannedTypes: This is the type that was already used in the original code
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

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
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
	 * Tooltip options.
	 * @default {}
	 */
	tooltip?: TooltipOptions;

	/**
	 * Options for the Typed.js component.
	 * @default {}
	 */
	typed?: TypedOptions;
}


export type RequiredTooltipOptions = Required<TooltipOptions>;
export type RequiredTypedOptions = Required<TypedOptions>;
export type RequiredGrapesBlocksOptions = Required<GrapesBlocksOptions>;