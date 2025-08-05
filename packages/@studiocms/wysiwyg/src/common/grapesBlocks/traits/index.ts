import type { CustomTrait, Editor } from 'grapesjs';
import formTraits from './formTraits.js';
import typedTraits from './typedTraits.js';

export const AddTrait = (editor: Editor) => <T>(id: string, def: CustomTrait<T>) => {
	editor.TraitManager.addType(id, def);
};

export function loadTraits(editor: Editor) {
	typedTraits(editor);
	formTraits(editor);
}

export default loadTraits;
