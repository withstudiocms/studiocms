import type { Editor, TraitProperties } from 'grapesjs';
import { typedId, typedTraitStringId } from '../consts.js';
import type { RequiredTypedOptions } from '../types.js';

declare global {
	interface Window {
		// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
		Typed: any;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
const getTraitType = (value: any): string => {
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'checkbox';
	return 'text';
};

export default (editor: Editor, opts: RequiredTypedOptions) => {
	const domc = editor.DomComponents;
	const { keys } = Object;

	// Same options of the library
	// https://github.com/mattboldt/typed.js#customization
	const typedProps = {
		strings: [],
		'type-speed': 0,
		'start-delay': 0,
		'back-speed': 0,
		'smart-backspace': true,
		'back-delay': 700,
		'fade-out': false,
		'fade-out-class': 'typed-fade-out',
		'fade-out-delay': 500,
		'show-cursor': true,
		'cursor-char': '|',
		'auto-insert-css': true,
		'bind-input-focus-events': false,
		'content-type': 'html',
		loop: false,
		'loop-count': Number.POSITIVE_INFINITY,
		shuffle: false,
		attr: '',
	};

	const typedPropsKeys = keys(typedProps);
	const traits: TraitProperties[] = typedPropsKeys
		.filter((item) => ['strings'].indexOf(item) < 0)
		.map((name) => ({
			changeProp: true,
			// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			type: getTraitType((typedProps as any)[name]),
			min: 0,
			name,
		}));

	traits.unshift({
		changeProp: true,
		name: 'strings',
		type: typedTraitStringId,
	});

	domc.addType(typedId, {
		model: {
			defaults: opts.props({
				...typedProps,
				typedsrc: opts.script,
				droppable: 0,
				traits,
				'script-props': [...typedPropsKeys, 'typedsrc'],
				script(props: typeof typedProps & { typedsrc: string }) {
					const getStrings = (value: string | string[]) => {
						if (Array.isArray(value)) {
							return value;
						}
						if (value.indexOf('\n') >= 0) {
							return value.split('\n');
						}
						return [];
					};
					const strings = getStrings(props.strings);
					// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
					const int = (num: any) => Number.parseInt(num, 10) || 0;
					// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
					const bool = (val: any) => !!val;
					const init = () => {
						const el = this as unknown as HTMLElement;
						el.innerHTML = '<span></span>';
						const loopCount = Number.parseInt(`${props['loop-count']}`, 10);
						`${props['type-speed']}`;
						const config = {
							typeSpeed: int(props['type-speed']),
							startDelay: int(props['start-delay']),
							backDelay: int(props['back-delay']),
							backSpeed: int(props['back-speed']),
							smartBackspace: bool(props['smart-backspace']),
							fadeOut: bool(props['fade-out']),
							fadeOutClass: props['fade-out-class'],
							fadeOutDelay: int(props['fade-out-delay']),
							shuffle: bool(props.shuffle),
							loop: bool(props.loop),
							loopCount: Number.isNaN(loopCount) ? Number.POSITIVE_INFINITY : loopCount,
							showCursor: bool(props['show-cursor']),
							cursorChar: props['cursor-char'],
							autoInsertCss: bool(props['auto-insert-css']),
							bindInputFocusEvents: bool(props['bind-input-focus-events']),
							attr: props.attr,
							contentType: props['content-type'],
						};

						if (strings?.length) {
							// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
							(config as any).strings = strings;
						}

						new window.Typed(el.children[0], config);
					};

					if (!window.Typed) {
						const scr = document.createElement('script');
						scr.src = props.typedsrc;
						scr.onload = init;
						document.head.appendChild(scr);
					} else {
						init();
					}
				},
				// biome-ignore lint/suspicious/noExplicitAny: This is the type that was already used in the original code
			}) as any,
		},
	});
};
