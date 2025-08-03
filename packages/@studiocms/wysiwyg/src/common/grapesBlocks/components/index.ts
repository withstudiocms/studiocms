import type { AddComponentTypeOptions, Editor } from 'grapesjs';
import type { RequiredGrapesBlocksOptions, RequiredTooltipOptions, RequiredTypedOptions } from '../types.js';
import tooltipComponent from './tooltip.js';
import typedComponent from './typed.js';

export const loadComponents = (editor: Editor, opts: RequiredGrapesBlocksOptions) => {
	const _addComponent = (id: string, def: AddComponentTypeOptions) => {
		editor.Components.addType(id, def);
	};

	tooltipComponent(editor, opts.tooltip as RequiredTooltipOptions);
	typedComponent(editor, opts.typed as RequiredTypedOptions);
};

export default loadComponents;
