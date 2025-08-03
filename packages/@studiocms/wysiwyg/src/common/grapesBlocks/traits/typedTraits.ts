import type { CustomTrait, Editor } from "grapesjs";
import { typedTraitStringId } from "../consts";

export default (editor: Editor) => {
    const addTrait = <T>(id: string, def: CustomTrait<T>) => {
        editor.TraitManager.addType(id, def);
    };

    addTrait(typedTraitStringId, {
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
}