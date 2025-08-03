import type { BlockProperties, ComponentDefinition, Editor } from 'grapesjs';
import type { RichTextEditorOptions } from './rte/index.js';

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


export type CountdownOptions = {
	/**
	 * The ID used to create the block and component
	 * @default 'countdown'
	 */
	id?: string;

	/**
	 * The label used for the block and the component.
	 * @default 'Countdown'
	 */
	label?: string;

	/**
	 * Object to extend the default block. Pass a falsy value to avoid adding the block.
	 * @example
	 * { label: 'Countdown', category: 'Extra', ... }
	 */
	block?: Partial<BlockProperties>;

	/**
	 * Object to extend the default component properties.
	 * @example
	 * { name: 'Countdown', droppable: false, ... }
	 */
	props?: ComponentDefinition;

	/**
	 * Custom CSS styles for the component. This will replace the default one.
	 * @default ''
	 */
	style?: string;

	/**
	 * Additional CSS styles for the component. These will be appended to the default one.
	 * @default ''
	 */
	styleAdditional?: string;

	/**
	 * Default start time.
	 * @default ''
	 * @example '2018-01-25 00:00'
	 */
	startTime?: string;

	/**
	 * Text to show when the countdown is ended.
	 * @default 'EXPIRED'
	 */
	endText?: string;

	/**
	 * Date input type, eg. `date`, `datetime-local`
	 * @default 'date'
	 */
	dateInputType?: string;

	/**
	 * Days label text used in component.
	 * @default 'days'
	 */
	labelDays?: string;

	/**
	 * Hours label text used in component.
	 * @default 'hours'
	 */
	labelHours?: string;

	/**
	 * Minutes label text used in component.
	 * @default 'minutes'
	 */
	labelMinutes?: string;

	/**
	 * Seconds label text used in component.
	 * @default 'seconds'
	 */
	labelSeconds?: string;

	/**
	 * Countdown component class prefix.
	 * @default 'countdown'
	 */
	classPrefix?: string;
};

export type CustomCodeOptions = {
	/**
	 * Object to extend the default custom code block. Pass a falsy value to avoid adding the block
	 * @example
	 * { label: 'Custom Code', category: 'Extra', ... }
	 */
	blockCustomCode?: Partial<BlockProperties>;

	/**
	 * Object to extend the default custom code properties.
	 * @example
	 * { name: 'Custom Code', droppable: false, ... }
	 */
	propsCustomCode?: ComponentDefinition;

	/**
	 * Object to extend the default component's toolbar button for the code. Pass a falsy value to avoid adding the button
	 * @example
	 * { label: '</>', attributes: { title: 'Open custom code' } }
	 */

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	toolbarBtnCustomCode?: Record<string, any>;

	/**
	 * Content to show when the custom code contains `<script>`
	 */
	placeholderScript?: string;

	/**
	 * Title for the custom code modal
	 * @default 'Insert your code'
	 */
	modalTitle?: string;

	/**
	 * Additional options for the code viewer.
	 * @example
	 * { theme: 'hopscotch', readOnly: 0 }
	 */

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	codeViewOptions?: Record<string, any>;

	/**
	 * Label for the default save button
	 * @default 'Save'
	 */
	buttonLabel?: string;

	/**
	 * Object to extend the default custom code command.
	 */

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	commandCustomCode?: Record<string, any>;
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
	 * Make use of flexbox for the grid
	 * @default false
	 */
	flexGrid?: boolean;

	/**
	 * Classes prefix
	 * @default 'gjs-'
	 */
	stylePrefix?: string;

	/**
	 * Use basic CSS for blocks
	 * @default true
	 */
	addBasicStyle?: boolean;

	/**
	 * 1 Column label
	 * @default '1 Column'
	 */
	labelColumn1?: string;

	/**
	 * 2 Columns label
	 * @default '2 Columns'
	 */
	labelColumn2?: string;

	/**
	 * 3 Columns label
	 * @default '3 Columns'
	 */
	labelColumn3?: string;

	/**
	 * 3/7 Columns label
	 * @default '2 Columns 3/7'
	 */
	labelColumn37?: string;

	/**
	 * Text label
	 * @default 'Text'
	 */
	labelText?: string;

	/**
	 * Link label
	 * @default 'Link'
	 */
	labelLink?: string;

	/**
	 * Image label
	 * @default 'Image'
	 */
	labelImage?: string;

	/**
	 * Video label
	 * @default 'Video'
	 */
	labelVideo?: string;

	/**
	 * Map label
	 * @default 'Map'
	 */
	labelMap?: string;

	/**
	 * Initial row height
	 * @default 75
	 */
	rowHeight?: number;

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

	/**
	 * Options for the Rich Text Editor component.
	 * @default {}
	 */
	rteOpts?: RichTextEditorOptions;

	countdown?: CountdownOptions;

	customCode?: CustomCodeOptions;
}

export type RequiredTooltipOptions = Required<TooltipOptions>;
export type RequiredTypedOptions = Required<TypedOptions>;
export type RequiredCountdownOptions = Required<CountdownOptions>;
export type RequiredCustomCodeOptions = Required<CustomCodeOptions>;
export type RequiredGrapesBlocksOptions = Required<GrapesBlocksOptions>;
