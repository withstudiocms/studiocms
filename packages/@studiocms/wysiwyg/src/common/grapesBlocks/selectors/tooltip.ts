import type { Editor } from 'grapesjs';
import type { RequiredTooltipOptions } from '../types';

export default (editor: Editor, opts: RequiredTooltipOptions) => {
	const { classTooltip, privateClasses } = opts;

	const classTooltipBody = `${classTooltip}__body`;
	const classTooltipEmpty = `${classTooltip}--empty`;

	if (privateClasses) {
		editor.SelectorManager.getAll().add([
			{ private: 1, name: classTooltip },
			{ private: 1, name: classTooltipBody },
			{ private: 1, name: classTooltipEmpty },
		]);
	}
};
