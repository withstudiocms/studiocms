import type { AddComponentTypeOptions, Editor } from 'grapesjs';
import type {
	RequiredCountdownOptions,
	RequiredCustomCodeOptions,
	RequiredGrapesBlocksOptions,
	RequiredTabsOptions,
	RequiredTooltipOptions,
	RequiredTypedOptions,
} from '../types.js';
import countdownComponent from './countdown.js';
import customCode from './customCode.js';
import formsComponents from './forms.js';
import tabLoader from './tabLoader.js';
import tooltipComponent from './tooltip.js';
import typedComponent from './typed.js';

export const AddComponent = (editor: Editor) => (id: string, def: AddComponentTypeOptions) => {
	editor.Components.addType(id, def);
};

export const loadComponents = (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	tooltipComponent(editor, opts.tooltip as RequiredTooltipOptions);
	typedComponent(editor, opts.typed as RequiredTypedOptions);
	countdownComponent(editor, opts.countdown as RequiredCountdownOptions);
	customCode(editor, opts.customCode as RequiredCustomCodeOptions);
	formsComponents(editor);
	tabLoader(editor, opts.tabOptions as RequiredTabsOptions);
};

export default loadComponents;
