import type { Editor } from 'grapesjs';
import type {
	RequiredCountdownOptions,
	RequiredCustomCodeOptions,
	RequiredGrapesBlocksOptions,
	RequiredTooltipOptions,
	RequiredTypedOptions,
} from '../types.js';
import countdownComponent from './countdown.js';
import customCode from './customCode.js';
import formsComponents from './forms.js';
import tooltipComponent from './tooltip.js';
import typedComponent from './typed.js';

export const loadComponents = (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	tooltipComponent(editor, opts.tooltip as RequiredTooltipOptions);
	typedComponent(editor, opts.typed as RequiredTypedOptions);
	countdownComponent(editor, opts.countdown as RequiredCountdownOptions);
	customCode(editor, opts.customCode as RequiredCustomCodeOptions);
	formsComponents(editor);
};

export default loadComponents;
