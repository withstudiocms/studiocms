import type { Editor } from "grapesjs";
import type { RequiredGrapesBlocksOptions, RequiredTooltipOptions } from "../types.js";

export function loadSelectors(editor: Editor, opts: RequiredGrapesBlocksOptions) {

	// Setup tooltip block
	const {
		classTooltip,
		privateClasses,
	} = opts.tooltip as RequiredTooltipOptions;

	const classTooltipBody = `${classTooltip}__body`;
	const classTooltipEmpty = `${classTooltip}--empty`;

	if (privateClasses) {
		editor.SelectorManager.getAll().add([
			{ private: 1, name: classTooltip },
			{ private: 1, name: classTooltipBody },
			{ private: 1, name: classTooltipEmpty },
		]);
	}

}

export default loadSelectors;