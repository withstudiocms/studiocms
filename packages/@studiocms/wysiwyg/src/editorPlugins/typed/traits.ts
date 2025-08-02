import type { Editor } from 'grapesjs';
import { traitStringId } from './utils.js';

export default (editor: Editor) => {
	editor.TraitManager.addType(traitStringId, {
		createInput({ component }) {
			return `<textarea>${component.get('strings').join('\n')}</textarea>`;
		},

		onUpdate({ component, elInput }) {
			elInput.value = component.get('strings').join('\n');
		},

		onEvent({ component, elInput }) {
			const value = (elInput.value || '').split('\n');
			component.set('strings', value);
		},
	});
};
