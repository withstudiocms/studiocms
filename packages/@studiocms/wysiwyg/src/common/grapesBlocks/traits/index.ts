import type { CustomTrait, Editor } from 'grapesjs';
import formTraits from './formTraits.js';
import typedTraits from './typedTraits.js';

export function loadTraits(editor: Editor) {
	const _addTrait = <T>(id: string, def: CustomTrait<T>) => {
		editor.TraitManager.addType(id, def);
	};

	typedTraits(editor);
	formTraits(editor);
}

export default loadTraits;
