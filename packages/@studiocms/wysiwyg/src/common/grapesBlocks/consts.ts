import type { RequiredGrapesBlocksOptions } from './types.js';

export const cmdImport = 'gjs-open-import-webpage';
export const cmdDeviceDesktop = 'set-device-desktop';
export const cmdDeviceTablet = 'set-device-tablet';
export const cmdDeviceMobile = 'set-device-mobile';
export const exportTemplate = 'export-template';
export const cmdClear = 'canvas-clear';
export const cmdSave = 'store-data';
export const typedId = 'typed';
export const typedTraitStringId = 'typed-strings';
export const keyCustomCode = 'custom-code-plugin__code';
export const typeCustomCode = 'custom-code';
export const commandNameCustomCode = 'custom-code:open-modal';
export const typeForm = 'form';
export const typeInput = 'input';
export const typeTextarea = 'textarea';
export const typeSelect = 'select';
export const typeCheckbox = 'checkbox';
export const typeRadio = 'radio';
export const typeButton = 'button';
export const typeLabel = 'label';
export const typeOption = 'option';

export const defaultGrapesBlocksOptions: RequiredGrapesBlocksOptions = {
	blocks: [
		'link-block',
		'quote',
		'text-basic',
		'tooltip',
		'typed',
		'column1',
		'column2',
		'column3',
		'column3-7',
		'text',
		'link',
		'image',
		'video',
		'map',
		'countdown',
		'custom-code',
		'form',
		'input',
		'textarea',
		'select',
		'button',
		'label',
		'checkbox',
		'radio',
	],
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
	countdown: {
		id: 'countdown',
		label: 'Countdown',
		block: {},
		props: {},
		style: '',
		styleAdditional: '',
		startTime: '',
		endText: 'EXPIRED',
		dateInputType: 'date',
		labelDays: 'days',
		labelHours: 'hours',
		labelMinutes: 'minutes',
		labelSeconds: 'seconds',
		classPrefix: 'countdown',
	},
	customCode: {
		blockCustomCode: {},
		propsCustomCode: {},
		toolbarBtnCustomCode: {},
		placeholderScript: `<div style="pointer-events: none; padding: 10px;">
      <svg viewBox="0 0 24 24" style="height: 30px; vertical-align: middle;">
        <path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"></path>
        </svg>
      Custom code with <i>&lt;script&gt;</i> can't be rendered on the canvas
    </div>`,
		modalTitle: 'Insert your code',
		codeViewOptions: {},
		buttonLabel: 'Save',
		commandCustomCode: {},
	},
};
