import type { Editor } from 'grapesjs';
import { typeOption } from '../consts.js';
import { AddTrait } from './index.js';

export default (editor: Editor) => {
	const addTrait = AddTrait(editor);

	addTrait('select-options', {
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
				// Skip empty lines
				if (!optionStr.trim()) continue;
				const option = optionStr.split('::');
				// Validate format
				if (option.length === 0) continue;
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
					const option = options.at(i);
					if (!option) continue;
					const optAttr = option.get('attributes');
					const optValue = optAttr?.value || '';
					const optTxtNode = option.components().at(0);
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
};
