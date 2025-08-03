import type { EditorConfig } from 'grapesjs';
import { GRAPES_CSS_PATH } from '../consts.js';

/**
 * The base configuration object for the WYSIWYG editor.
 *
 * This partial configuration of `EditorConfig` defines the default settings for the editor container,
 * dimensions, storage management, panels, canvas styles, and the style manager sectors.
 *
 * @remarks
 * - The `container` property specifies the DOM selector for the editor.
 * - The `height` and `width` properties define the editor's dimensions.
 * - `storageManager` is set to use inline storage.
 * - `panels` are initialized as empty.
 * - The `canvas` property includes an array of stylesheets to be loaded.
 * - The `styleManager` property organizes style controls into sectors such as General, Dimension, Typography, Decorations, Extra, and Flex.
 *   Each sector contains properties or buildProps for customizing the appearance and layout of elements within the editor.
 *
 * @example
 * ```typescript
 * import { baseConfig } from './editor-settings';
 * // Use baseConfig to initialize the editor
 * ```
 */
export const baseConfig: Partial<EditorConfig> = {
	container: '#gjs',
	height: '100%',
	width: 'auto',
	fromElement: false,
	storageManager: { type: 'inline' },
	panels: { defaults: [] },
	canvas: {
		styles: [GRAPES_CSS_PATH],
	},
	styleManager: {
		sectors: [
			{
				name: 'General',
				properties: [
					{
						extend: 'float',
						type: 'radio',
						default: 'none',
						options: [
							{
								value: 'none',
								className: 'fa fa-times',
								id: '',
							},
							{
								value: 'left',
								className: 'fa fa-align-left',
								id: '',
							},
							{
								value: 'right',
								className: 'fa fa-align-right',
								id: '',
							},
						],
					},
					'display',
					{ extend: 'position', type: 'select' },
					'top',
					'right',
					'left',
					'bottom',
				],
			},
			{
				name: 'Dimension',
				open: false,
				properties: [
					'width',
					{
						id: 'flex-width',
						type: 'integer',
						name: 'Width',
						units: ['px', '%'],
						property: 'flex-basis',
						toRequire: true,
					},
					'height',
					'max-width',
					'min-height',
					'margin',
					'padding',
				],
			},
			{
				name: 'Typography',
				open: false,
				properties: [
					'font-family',
					'font-size',
					'font-weight',
					'letter-spacing',
					'color',
					'line-height',
					{
						extend: 'text-align',
						options: [
							{
								id: 'left',
								label: 'Left',
								className: 'fa fa-align-left',
							},
							{
								id: 'center',
								label: 'Center',
								className: 'fa fa-align-center',
							},
							{
								id: 'right',
								label: 'Right',
								className: 'fa fa-align-right',
							},
							{
								id: 'justify',
								label: 'Justify',
								className: 'fa fa-align-justify',
							},
						],
					},
					{
						property: 'text-decoration',
						type: 'radio',
						default: 'none',
						options: [
							{
								id: 'none',
								label: 'None',
								className: 'fa fa-times',
							},
							{
								id: 'underline',
								label: 'underline',
								className: 'fa fa-underline',
							},
							{
								id: 'line-through',
								label: 'Line-through',
								className: 'fa fa-strikethrough',
							},
						],
					},
					'text-shadow',
				],
			},
			{
				name: 'Decorations',
				open: false,
				properties: [
					'opacity',
					'border-radius',
					'border',
					'box-shadow',
					'background', // { id: 'background-bg', property: 'background', type: 'bg' }
				],
			},
			{
				name: 'Extra',
				open: false,
				buildProps: ['transition', 'perspective', 'transform'],
			},
			{
				name: 'Flex',
				open: false,
				properties: [
					{
						name: 'Flex Container',
						property: 'display',
						type: 'select',
						defaults: 'block',
						list: [
							{ value: 'block', name: 'Disable', id: '' },
							{ value: 'flex', name: 'Enable', id: '' },
						],
					},
					{
						name: 'Flex Parent',
						property: 'label-parent-flex',
						type: 'integer',
					},
					{
						name: 'Direction',
						property: 'flex-direction',
						type: 'radio',
						defaults: 'row',
						list: [
							{
								value: 'row',
								name: 'Row',
								className: 'icons-flex icon-dir-row',
								title: 'Row',
								id: '',
							},
							{
								value: 'row-reverse',
								name: 'Row reverse',
								className: 'icons-flex icon-dir-row-rev',
								title: 'Row reverse',
								id: '',
							},
							{
								value: 'column',
								name: 'Column',
								title: 'Column',
								className: 'icons-flex icon-dir-col',
								id: '',
							},
							{
								value: 'column-reverse',
								name: 'Column reverse',
								title: 'Column reverse',
								className: 'icons-flex icon-dir-col-rev',
								id: '',
							},
						],
					},
					{
						name: 'Justify',
						property: 'justify-content',
						type: 'radio',
						defaults: 'flex-start',
						list: [
							{
								value: 'flex-start',
								className: 'icons-flex icon-just-start',
								title: 'Start',
								id: '',
							},
							{
								value: 'flex-end',
								title: 'End',
								className: 'icons-flex icon-just-end',
								id: '',
							},
							{
								value: 'space-between',
								title: 'Space between',
								className: 'icons-flex icon-just-sp-bet',
								id: '',
							},
							{
								value: 'space-around',
								title: 'Space around',
								className: 'icons-flex icon-just-sp-ar',
								id: '',
							},
							{
								value: 'center',
								title: 'Center',
								className: 'icons-flex icon-just-sp-cent',
								id: '',
							},
						],
					},
					{
						name: 'Align',
						property: 'align-items',
						type: 'radio',
						defaults: 'center',
						list: [
							{
								value: 'flex-start',
								title: 'Start',
								className: 'icons-flex icon-al-start',
								id: '',
							},
							{
								value: 'flex-end',
								title: 'End',
								className: 'icons-flex icon-al-end',
								id: '',
							},
							{
								value: 'stretch',
								title: 'Stretch',
								className: 'icons-flex icon-al-str',
								id: '',
							},
							{
								value: 'center',
								title: 'Center',
								className: 'icons-flex icon-al-center',
								id: '',
							},
						],
					},
					{
						name: 'Flex Children',
						property: 'label-parent-flex',
						type: 'integer',
					},
					{
						name: 'Order',
						property: 'order',
						type: 'integer',
						defaults: '0',
						min: 0,
					},
					{
						name: 'Flex',
						property: 'flex',
						type: 'composite',
						properties: [
							{
								name: 'Grow',
								property: 'flex-grow',
								type: 'integer',
								defaults: '0',
								min: 0,
							},
							{
								name: 'Shrink',
								property: 'flex-shrink',
								type: 'integer',
								defaults: '0',
								min: 0,
							},
							{
								name: 'Basis',
								property: 'flex-basis',
								type: 'integer',
								units: ['px', '%', ''],
								unit: '',
								defaults: 'auto',
							},
						],
					},
					{
						name: 'Align',
						property: 'align-self',
						type: 'radio',
						defaults: 'auto',
						list: [
							{
								value: 'auto',
								name: 'Auto',
								id: '',
							},
							{
								value: 'flex-start',
								title: 'Start',
								className: 'icons-flex icon-al-start',
								id: '',
							},
							{
								value: 'flex-end',
								title: 'End',
								className: 'icons-flex icon-al-end',
								id: '',
							},
							{
								value: 'stretch',
								title: 'Stretch',
								className: 'icons-flex icon-al-str',
								id: '',
							},
							{
								value: 'center',
								title: 'Center',
								className: 'icons-flex icon-al-center',
								id: '',
							},
						],
					},
				],
			},
		],
	},
};
