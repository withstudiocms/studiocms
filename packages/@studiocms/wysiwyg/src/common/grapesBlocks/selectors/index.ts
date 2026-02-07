import type { Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions, RequiredTooltipOptions } from '../types.js';
import loadTooltip from './tooltip.js';

export function loadSelectors(editor: Editor, opts: RequiredGrapesBlocksOptions) {
	loadTooltip(editor, opts.tooltip as RequiredTooltipOptions);
}

export default loadSelectors;
