import type { Editor } from 'grapesjs';
import { typeOption } from './components.js';

export default function (editor: Editor) {
	const trm = editor.TraitManager;

	trm.addType('select-options', {
		events: {
			keyup: 'onChange',
		},

		onValueChange() {
			const { model, target } = this;
			const optionsStr = model.get('value').trim();
			const options = optionsStr.split('\n');
			const optComps = [];

			for (let i = 0; i < options.length; i++) {
				const optionStr = options[i];
				const option = optionStr.split('::');
				optComps.push({
					type: typeOption,
					components: option[1] || option[0],
					attributes: { value: option[0] },
				});
			}

			target.components().reset(optComps);
			target.view?.render();
		},

		getInputEl() {
			if (!this.$input) {
				const optionsArr = [];
				const options = this.target.components();

				for (let i = 0; i < options.length; i++) {
					const option = options.models[i];
					const optAttr = option.get('attributes');
					const optValue = optAttr?.value || '';
					const optTxtNode = option.components().models[0];
					const optLabel = optTxtNode?.get('content') || '';
					optionsArr.push(`${optValue}::${optLabel}`);
				}

				const el = document.createElement('textarea');
				el.value = optionsArr.join('\n');
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
				this.$input = el as any;
			}

			return this.$input;
		},
	});
}
