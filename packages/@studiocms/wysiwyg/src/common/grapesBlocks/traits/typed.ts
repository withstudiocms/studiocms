import type { Component, CustomTrait, Trait } from 'grapesjs';

type Typed = {
	createInput({
		component,
	}: {
		component: Component;
		trait: Trait;
		elInput: HTMLInputElement;
	}): string;
	onUpdate({
		component,
		elInput,
	}: {
		component: Component;
		trait: Trait;
		elInput: HTMLInputElement;
	}): void;
	onEvent({
		component,
		elInput,
	}: {
		component: Component;
		trait: Trait;
		elInput: HTMLInputElement;
	}): void;
};

export const typedTrait: CustomTrait<Typed> = {
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
};
