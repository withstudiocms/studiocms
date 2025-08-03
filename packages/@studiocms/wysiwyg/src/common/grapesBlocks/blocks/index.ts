import type { BlockProperties, Editor } from 'grapesjs';
import {
	typeButton,
	typeCheckbox,
	typeCustomCode,
	typedId,
	typeForm,
	typeInput,
	typeLabel,
	typeRadio,
	typeSelect,
	typeTextarea,
} from '../consts.js';
import type {
	RequiredCountdownOptions,
	RequiredCustomCodeOptions,
	RequiredGrapesBlocksOptions,
	RequiredTooltipOptions,
} from '../types.js';
import { linkBlock, quoteBlock, textBasicBlock } from './basicBlocks.js';
import { tooltipComponent, typedComponent } from './extraBlocks.js';

export function loadBlocks(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	const addBlock = (id: string, def: BlockProperties) => {
		// biome-ignore lint/style/noNonNullAssertion: this is a required option
		opts.blocks.indexOf(id)! >= 0 &&
			editor.Blocks.add(id, {
				select: true,
				...def,
				...opts.block(id),
			});
	};

	const { stylePrefix, flexGrid, rowHeight, addBasicStyle } = opts;
	const clsRow = `${stylePrefix}row`;
	const clsCell = `${stylePrefix}cell`;
	const styleRow = flexGrid
		? `
    .${clsRow} {
      display: flex;
      justify-content: flex-start;
      align-items: stretch;
      flex-wrap: nowrap;
      padding: 10px;
    }
    @media (max-width: 768px) {
      .${clsRow} {
        flex-wrap: wrap;
      }
    }`
		: `
    .${clsRow} {
      display: table;
      padding: 10px;
      width: 100%;
    }
    @media (max-width: 768px) {
      .${stylePrefix}cell, .${stylePrefix}cell30, .${stylePrefix}cell70 {
        width: 100%;
        display: block;
      }
    }`;
	const styleClm = flexGrid
		? `
    .${clsCell} {
      min-height: ${rowHeight}px;
      flex-grow: 1;
      flex-basis: 100%;
    }`
		: `
    .${clsCell} {
      width: 8%;
      display: table-cell;
      height: ${rowHeight}px;
    }`;
	const styleClm30 = `
  .${stylePrefix}cell30 {
    width: 30%;
  }`;
	const styleClm70 = `
  .${stylePrefix}cell70 {
    width: 70%;
  }`;

	const step = 0.2;
	const minDim = 1;
	const currentUnit = 1;
	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	const resizerBtm: Record<string, any> = {
		tl: 0,
		tc: 0,
		tr: 0,
		cl: 0,
		cr: 0,
		bl: 0,
		br: 0,
		minDim,
	};
	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	const resizerRight: Record<string, any> = {
		...resizerBtm,
		cr: 1,
		bc: 0,
		currentUnit,
		minDim,
		step,
	};

	// Flex elements do not react on width style change therefore I use
	// 'flex-basis' as keyWidth for the resizer on columns
	if (flexGrid) {
		resizerRight.keyWidth = 'flex-basis';
	}

	const rowAttr = {
		class: clsRow,
		'data-gjs-droppable': `.${clsCell}`,
		'data-gjs-resizable': resizerBtm,
		'data-gjs-name': 'Row',
	};

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	const colAttr: Record<string, any> = {
		class: clsCell,
		'data-gjs-draggable': `.${clsRow}`,
		'data-gjs-resizable': resizerRight,
		'data-gjs-name': 'Cell',
	};

	if (flexGrid) {
		colAttr['data-gjs-unstylable'] = ['width'];
		colAttr['data-gjs-stylable-require'] = ['flex-basis'];
	}

	// Make row and column classes private
	const privateCls = [`.${clsRow}`, `.${clsCell}`];
	editor.on(
		'selector:add',
		(selector) => privateCls.indexOf(selector.getFullName()) >= 0 && selector.set('private', 1)
	);

	// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
	const attrsToString = (attrs: Record<string, any>) => {
		const result = [];

		for (const key in attrs) {
			let value = attrs[key];
			const toParse = Array.isArray(value) || value instanceof Object;
			value = toParse ? JSON.stringify(value) : value;
			result.push(`${key}=${toParse ? `'${value}'` : `'${value}'`}`);
		}

		return result.length ? ` ${result.join(' ')}` : '';
	};

	const attrsRow = attrsToString(rowAttr);
	const attrsCell = attrsToString(colAttr);

	const commonBasicBlockProps: Partial<BlockProperties> = {
		category: 'Basic',
		select: true,
	};

	// Add the basic blocks
	addBlock('link-block', linkBlock);
	addBlock('quote', quoteBlock);
	addBlock('text-basic', textBasicBlock);
	addBlock('column1', {
		...commonBasicBlockProps,
		label: opts.labelColumn1,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M2 20h20V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z"/>
      </svg>`,
		content: `<div ${attrsRow}>
        <div ${attrsCell}></div>
      </div>
      ${
				addBasicStyle
					? `<style>
          ${styleRow}
          ${styleClm}
        </style>`
					: ''
			}`,
	});
	addBlock('column2', {
		...commonBasicBlockProps,
		label: opts.labelColumn2,
		media: `<svg viewBox="0 0 23 24">
        <path fill="currentColor" d="M2 20h8V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1ZM13 20h8V4h-8v16Zm-1 0V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1Z"/>
      </svg>`,
		content: `<div ${attrsRow}>
        <div ${attrsCell}></div>
        <div ${attrsCell}></div>
      </div>
      ${
				addBasicStyle
					? `<style>
          ${styleRow}
          ${styleClm}
        </style>`
					: ''
			}`,
	});
	addBlock('column3', {
		...commonBasicBlockProps,
		label: opts.labelColumn3,
		media: `<svg viewBox="0 0 23 24">
        <path fill="currentColor" d="M2 20h4V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1ZM17 20h4V4h-4v16Zm-1 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1ZM9.5 20h4V4h-4v16Zm-1 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1Z"/>
      </svg>`,
		content: `<div ${attrsRow}>
        <div ${attrsCell}></div>
        <div ${attrsCell}></div>
        <div ${attrsCell}></div>
      </div>
      ${
				addBasicStyle
					? `<style>
          ${styleRow}
          ${styleClm}
        </style>`
					: ''
			}`,
	});
	addBlock('column3-7', {
		...commonBasicBlockProps,
		label: opts.labelColumn37,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M2 20h5V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1ZM10 20h12V4H10v16Zm-1 0V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1Z"/>
      </svg>`,
		content: `<div ${attrsRow}>
        <div ${attrsCell} style='${flexGrid ? 'flex-basis' : 'width'}: 30%;'></div>
        <div ${attrsCell} style='${flexGrid ? 'flex-basis' : 'width'}: 70%;'></div>
      </div>
      ${
				addBasicStyle
					? `<style>
          ${styleRow}
          ${styleClm}
          ${styleClm30}
          ${styleClm70}
        </style>`
					: ''
			}`,
	});
	addBlock('text', {
		...commonBasicBlockProps,
		activate: true,
		label: opts.labelText,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
      </svg>`,
		content: {
			type: 'text',
			content: 'Insert your text here',
			style: { padding: '10px' },
		},
	});
	addBlock('link', {
		...commonBasicBlockProps,
		label: opts.labelLink,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
      </svg>`,
		content: {
			type: 'link',
			content: 'Link',
			style: { color: '#d983a6' },
		},
	});
	addBlock('image', {
		...commonBasicBlockProps,
		activate: true,
		label: opts.labelImage,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M21,3H3C2,3 1,4 1,5V19A2,2 0 0,0 3,21H21C22,21 23,20 23,19V5C23,4 22,3 21,3M5,17L8.5,12.5L11,15.5L14.5,11L19,17H5Z" />
      </svg>`,
		content: {
			style: { color: 'black' },
			type: 'image',
		},
	});
	addBlock('video', {
		...commonBasicBlockProps,
		label: opts.labelVideo,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" />
      </svg>`,
		content: {
			type: 'video',
			src: 'img/video2.webm',
			style: {
				height: '350px',
				width: '615px',
			},
		},
	});
	addBlock('map', {
		...commonBasicBlockProps,
		label: opts.labelMap,
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M20.5,3L20.34,3.03L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21L3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19.03 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3M10,5.47L14,6.87V18.53L10,17.13V5.47M5,6.46L8,5.45V17.15L5,18.31V6.46M19,17.54L16,18.55V6.86L19,5.7V17.54Z" />
      </svg>`,
		content: {
			type: 'map',
			style: { height: '350px' },
		},
	});

	// Setup tooltip block
	const { id: tooltipId, labelTooltip, blockTooltip } = opts.tooltip as RequiredTooltipOptions;

	if (blockTooltip) {
		addBlock(tooltipId, {
			label: labelTooltip,
			content: { type: tooltipId },
			...tooltipComponent,
			...blockTooltip,
		});
	}

	addBlock(typedId, {
		...typedComponent,
		...opts.typed.block,
	});

	// Setup countdown block
	const {
		block: countdownBlock,
		id: countdownId,
		label: countdownLabel,
	} = opts.countdown as RequiredCountdownOptions;

	if (countdownBlock) {
		addBlock(countdownId, {
			media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 20C16.4 20 20 16.4 20 12S16.4 4 12 4 4 7.6 4 12 7.6 20 12 20M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2M17 11.5V13H11V7H12.5V11.5H17Z" />
      </svg>`,
			label: countdownLabel,
			category: 'Extra',
			select: true,
			content: { type: countdownId },
			...countdownBlock,
		});
	}

	// Setup customCode block
	const { blockCustomCode } = opts.customCode as RequiredCustomCodeOptions;

	if (blockCustomCode) {
		addBlock(typeCustomCode, {
			label: 'Custom Code',
			media: `
			  <svg viewBox="0 0 24 24">
				<path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4m-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z"></path>
			  </svg>
			`,
			category: 'Extra',
			activate: true,
			select: true,
			content: { type: typeCustomCode },
			...blockCustomCode,
		});
	}

	// Setup forms blocks
	const formsCategory = 'Forms';

	addBlock(typeForm, {
		label: 'Form',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 5.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 8H3V6h18v2zM22 10.5c0-.3-.5-.5-1.3-.5H3.4c-.8 0-1.3.2-1.3.5v3c0 .3.5.5 1.3.5h17.4c.8 0 1.3-.2 1.3-.5v-3zM21 13H3v-2h18v2z"/><rect width="10" height="3" x="2" y="15" rx=".5"/></svg>',
		content: {
			type: typeForm,
			components: [
				{
					components: [{ type: typeLabel, components: 'Name' }, { type: typeInput }],
				},
				{
					components: [
						{ type: typeLabel, components: 'Email' },
						{ type: typeInput, attributes: { type: 'email' } },
					],
				},
				{
					components: [
						{ type: typeLabel, components: 'Gender' },
						{ type: typeCheckbox, attributes: { value: 'M' } },
						{ type: typeLabel, components: 'M' },
						{ type: typeCheckbox, attributes: { value: 'F' } },
						{ type: typeLabel, components: 'F' },
					],
				},
				{
					components: [{ type: typeLabel, components: 'Message' }, { type: typeTextarea }],
				},
				{
					components: [{ type: typeButton }],
				},
			],
		},
	});

	addBlock(typeInput, {
		label: 'Input',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 10h1v4H4z"/></svg>',
		content: { type: typeInput },
	});

	addBlock(typeTextarea, {
		label: 'Textarea',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 7.5c0-.9-.5-1.5-1.3-1.5H3.4C2.5 6 2 6.6 2 7.5v9c0 .9.5 1.5 1.3 1.5h17.4c.8 0 1.3-.6 1.3-1.5v-9zM21 17H3V7h18v10z"/><path d="M4 8h1v4H4zM19 7h1v10h-1zM20 8h1v1h-1zM20 15h1v1h-1z"/></svg>',
		content: { type: typeTextarea },
	});

	addBlock(typeSelect, {
		label: 'Select',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M18.5 13l1.5-2h-3zM4 11.5h11v1H4z"/></svg>',
		content: { type: typeSelect },
	});

	addBlock(typeButton, {
		label: 'Button',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 9c0-.6-.5-1-1.3-1H3.4C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.3 1h17.4c.8 0 1.3-.4 1.3-1V9zm-1 6H3V9h18v6z"/><path d="M4 11.5h16v1H4z"/></svg>',
		content: { type: typeButton },
	});

	addBlock(typeLabel, {
		label: 'Label',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 11.9c0-.6-.5-.9-1.3-.9H3.4c-.8 0-1.3.3-1.3.9V17c0 .5.5.9 1.3.9h17.4c.8 0 1.3-.4 1.3-.9V12zM21 17H3v-5h18v5z"/><rect width="14" height="5" x="2" y="5" rx=".5"/><path d="M4 13h1v3H4z"/></svg>',
		content: { type: typeLabel },
	});

	addBlock(typeCheckbox, {
		label: 'Checkbox',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 17l-5-5 1.41-1.42L10 14.17l7.59-7.59L19 8m0-5H5c-1.11 0-2 .89-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2z"></path></svg>',
		content: { type: typeCheckbox },
	});

	addBlock(typeRadio, {
		label: 'Radio',
		category: formsCategory,
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-18C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 5c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"></path></svg>',
		content: { type: typeRadio },
	});
}

export default loadBlocks;
