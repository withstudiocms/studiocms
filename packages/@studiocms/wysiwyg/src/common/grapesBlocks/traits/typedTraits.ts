import type { CustomTrait, Editor } from 'grapesjs';
import { typedTraitStringId } from '../consts';

export default (editor: Editor) => {
	const addTrait = <T>(id: string, def: CustomTrait<T>) => {
		editor.TraitManager.addType(id, def);
	};

	addTrait(typedTraitStringId, {
		createInput({ component }) {
			const strings = component.get('strings');
			const stringsArray = Array.isArray(strings) ? strings : [];
			return `<textarea>${stringsArray.join('\n')}</textarea>`;
		},

		onUpdate({ component, elInput }) {
			const strings = component.get('strings');
			const stringsArray = Array.isArray(strings) ? strings : [];
			elInput.value = stringsArray.join('\n');
		},

		onEvent({ component, elInput }) {
			const value = (elInput.value || '').split('\n');
			component.set('strings', value);
		},
	});
};
