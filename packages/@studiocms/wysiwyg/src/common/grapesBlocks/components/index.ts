import type { Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions, RequiredTooltipOptions } from '../types.js';
import { tooltipComponent } from './tooltip.js';

export const loadComponents = (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	tooltipComponent(editor, opts.tooltip as RequiredTooltipOptions);
};

export default loadComponents;
