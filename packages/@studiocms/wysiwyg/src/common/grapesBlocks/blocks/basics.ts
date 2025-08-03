import type { BlockProperties, Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions } from '../types.js';

export default (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const addBlock = (id: string, def: BlockProperties) => {
		opts.blocks.indexOf(id) >= 0 &&
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
			result.push(`${key}=${toParse ? `'${value}'` : `"${value}"`}`);
		}

		return result.length ? ` ${result.join(' ')}` : '';
	};

	const attrsRow = attrsToString(rowAttr);
	const attrsCell = attrsToString(colAttr);

	const category = 'Basic';

	const commonBasicBlockProps: Partial<BlockProperties> = {
		category,
		select: true,
	};

	// Add the basic blocks
	addBlock('link-block', {
		category,
		label: 'Link Block',
		media: `<svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"></path>
    </svg>`,
		content: {
			type: 'link',
			editable: false,
			droppable: true,
			style: {
				display: 'inline-block',
				padding: '5px',
				'min-height': '50px',
				'min-width': '50px',
			},
		},
	});
	addBlock('quote', {
		category,
		label: 'Quote',
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
    </svg>`,
		content: `<blockquote class="quote">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore ipsum dolor sit
      </blockquote>`,
	});
	addBlock('text-basic', {
		category,
		label: 'Text section',
		media: `<svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M21,6V8H3V6H21M3,18H12V16H3V18M3,13H21V11H3V13Z" />
    </svg>`,
		content: `<section class="bdg-sect">
      <h1 class="heading">Insert title here</h1>
      <p class="paragraph">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</p>
      </section>`,
	});

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
};
