import type { Editor } from 'grapesjs';

export const typeForm = 'form';
export const typeInput = 'input';
export const typeTextarea = 'textarea';
export const typeSelect = 'select';
export const typeCheckbox = 'checkbox';
export const typeRadio = 'radio';
export const typeButton = 'button';
export const typeLabel = 'label';
export const typeOption = 'option';

export default function (editor: Editor) {
	const { Components } = editor;

	const idTrait = {
		name: 'id',
	};

	const forTrait = {
		name: 'for',
	};

	const nameTrait = {
		name: 'name',
	};

	const placeholderTrait = {
		name: 'placeholder',
	};

	const valueTrait = {
		name: 'value',
	};

	const requiredTrait = {
		type: 'checkbox',
		name: 'required',
	};

	const checkedTrait = {
		type: 'checkbox',
		name: 'checked',
	};

	const createOption = (value: string, content: string) => {
		return { type: typeOption, content, attributes: { value } };
	};

	const checkIfInPreview = (ev: Event) => {
		if (!editor.Commands.isActive('preview')) {
			ev.preventDefault();
		}
	};

	Components.addType(typeForm, {
		isComponent: (el) => el.tagName === 'FORM',

		model: {
			defaults: {
				tagName: 'form',
				droppable: ':not(form)',
				draggable: ':not(form)',
				attributes: { method: 'get' },
				traits: [
					{
						type: 'select',
						name: 'method',
						options: [
							{
								value: 'get',
								name: 'GET',
								id: '',
							},
							{
								value: 'post',
								name: 'POST',
								id: '',
							},
						],
					},
					{
						name: 'action',
					},
				],
			},
		},

		view: {
			events: {
				// The submit of the form might redirect the user from the editor so
				// we should always prevent the default here.
				submit: (e: Event) => e.preventDefault(),
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			} as any,
		},
	});

	// INPUT
	Components.addType(typeInput, {
		isComponent: (el) => el.tagName === 'INPUT',

		model: {
			defaults: {
				tagName: 'input',
				droppable: false,
				highlightable: false,
				attributes: { type: 'text' },
				traits: [
					nameTrait,
					placeholderTrait,
					{
						type: 'select',
						name: 'type',
						options: [
							{
								value: 'text',
								id: '',
							},
							{
								value: 'email',
								id: '',
							},
							{
								value: 'password',
								id: '',
							},
							{
								value: 'number',
								id: '',
							},
						],
					},
					requiredTrait,
				],
			},
		},

		extendFnView: ['updateAttributes'],
		view: {
			updateAttributes() {
				this.el.setAttribute('autocomplete', 'off');
			},
		},
	});

	// TEXTAREA
	Components.addType(typeTextarea, {
		extend: typeInput,
		isComponent: (el) => el.tagName === 'TEXTAREA',

		model: {
			defaults: {
				tagName: 'textarea',
				attributes: {},
				traits: [nameTrait, placeholderTrait, requiredTrait],
			},
		},
	});

	// OPTION
	Components.addType(typeOption, {
		isComponent: (el) => el.tagName === 'OPTION',

		model: {
			defaults: {
				tagName: 'option',
				layerable: false,
				droppable: false,
				draggable: false,
				highlightable: false,
			},
		},
	});

	// SELECT
	Components.addType(typeSelect, {
		isComponent: (el) => el.tagName === 'SELECT',

		model: {
			defaults: {
				tagName: 'select',
				droppable: false,
				highlightable: false,
				components: [createOption('opt1', 'Option 1'), createOption('opt2', 'Option 2')],
				traits: [
					nameTrait,
					{
						name: 'options',
						type: 'select-options',
					},
					requiredTrait,
				],
			},
		},

		view: {
			events: {
				mousedown: checkIfInPreview,
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			} as any,
		},
	});

	// CHECKBOX
	Components.addType(typeCheckbox, {
		extend: typeInput,
		isComponent: (el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox',

		model: {
			defaults: {
				copyable: false,
				attributes: { type: 'checkbox' },
				traits: [idTrait, nameTrait, valueTrait, requiredTrait, checkedTrait],
			},
		},

		view: {
			events: {
				click: checkIfInPreview,
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			} as any,

			init() {
				this.listenTo(this.model, 'change:attributes:checked', this.handleChecked);
			},

			handleChecked() {
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
				(this.el as any).checked = !!this.model.get('attributes')?.checked;
			},
		},
	});

	// RADIO
	Components.addType(typeRadio, {
		extend: typeCheckbox,
		isComponent: (el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'radio',

		model: {
			defaults: {
				attributes: { type: 'radio' },
			},
		},
	});

	Components.addType(typeButton, {
		extend: typeInput,
		isComponent: (el) => el.tagName === 'BUTTON',

		model: {
			defaults: {
				tagName: 'button',
				attributes: { type: 'button' },
				text: 'Send',
				traits: [
					{
						name: 'text',
						changeProp: true,
					},
					{
						type: 'select',
						name: 'type',
						options: [
							{
								value: 'button',
								id: '',
							},
							{
								value: 'submit',
								id: '',
							},
							{
								value: 'reset',
								id: '',
							},
						],
					},
				],
			},

			init() {
				const comps = this.components();
				const tChild = comps.length === 1 && comps.models[0];
				// biome-ignore lint/complexity/useOptionalChain: This is the type that was already used in the original code
				const chCnt = (tChild && tChild.is('textnode') && tChild.get('content')) || '';
				const text = chCnt || this.get('text');
				this.set('text', text);
				this.on('change:text', this.__onTextChange);
				text !== chCnt && this.__onTextChange();
			},

			__onTextChange() {
				this.components(this.get('text'));
			},
		},

		view: {
			events: {
				click: checkIfInPreview,
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			} as any,
		},
	});

	// LABEL
	Components.addType(typeLabel, {
		extend: 'text',
		isComponent: (el) => el.tagName === 'LABEL',

		model: {
			defaults: {
				tagName: 'label',
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
				components: 'Label' as any,
				traits: [forTrait],
			},
		},
	});
}
