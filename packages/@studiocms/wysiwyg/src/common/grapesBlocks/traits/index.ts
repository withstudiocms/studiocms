import type { CustomTrait, Editor } from "grapesjs";
import { typedTraitStringId } from "../consts.js";
import { typedTrait } from "./typed.js";
// import type { RequiredGrapesBlocksOptions } from "../types.js";

export function loadTraits(editor: Editor) {
    const addTrait = <T>(id: string, def: CustomTrait<T>) => {
        editor.TraitManager.addType(id, def);
    };

    addTrait(typedTraitStringId, typedTrait)
}

export default loadTraits;