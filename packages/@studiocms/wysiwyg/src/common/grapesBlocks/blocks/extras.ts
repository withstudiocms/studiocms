import type { BlockProperties, Editor } from 'grapesjs';
import { typeCustomCode, typedId } from '../consts.js';
import type {
	RequiredCountdownOptions,
	RequiredCustomCodeOptions,
	RequiredGrapesBlocksOptions,
	RequiredTooltipOptions,
} from '../types.js';

export default (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const addBlock = (id: string, def: BlockProperties) => {
		opts.blocks.indexOf(id) >= 0 &&
			editor.Blocks.add(id, {
				select: true,
				...def,
				...opts.block(id),
			});
	};

	const extrasCategory = 'Extra';

	const sharedExtraBlockProps: Partial<BlockProperties> = {
		select: true,
		category: extrasCategory,
	};

	// Setup tooltip block
	const { id: tooltipId, labelTooltip, blockTooltip } = opts.tooltip as RequiredTooltipOptions;

	if (blockTooltip) {
		addBlock(tooltipId, {
			label: labelTooltip,
			content: { type: tooltipId },
			media: `<svg viewBox="0 0 24 24">
          <path d="M4 2h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-4l-4 4-4-4H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2m0 2v12h4.83L12 19.17 15.17 16H20V4H4z"></path>
        </svg>`,
			...sharedExtraBlockProps,
			...blockTooltip,
		});
	}

	addBlock(typedId, {
		label: 'Typed',
		media:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><path d="M212.3 44l2.3 49.6h-6A60 60 0 00204 75c-3.2-6-7.5-10.5-12.9-13.3a44.9 44.9 0 00-21.1-4.3h-29.8V219c0 13 1.4 21 4.2 24.3 4 4.4 10 6.6 18.2 6.6h7.4v5.7H80.2V250h7.5c9 0 15.3-2.7 19-8.2 2.4-3.3 3.5-10.9 3.5-22.7V57.3H84.8a71 71 0 00-21.1 2.2 29 29 0 00-13.9 11.3 46.1 46.1 0 00-6.9 22.8H37L39.5 44h172.8zM245 22h18v256h-18z"/></svg>',
		content: { type: typedId },
		...sharedExtraBlockProps,
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
			content: { type: countdownId },
			...sharedExtraBlockProps,
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
			activate: true,
			...sharedExtraBlockProps,
			content: { type: typeCustomCode },
			...blockCustomCode,
		});
	}
};
