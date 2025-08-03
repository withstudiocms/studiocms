import type { BlockProperties, Editor } from 'grapesjs';
import { typedId } from '../consts.js';
import type { RequiredGrapesBlocksOptions, RequiredTooltipOptions } from '../types.js';
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

	// Add the basic blocks
	addBlock('link-block', linkBlock);
	addBlock('quote', quoteBlock);
	addBlock('text-basic', textBasicBlock);

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
}

export default loadBlocks;
