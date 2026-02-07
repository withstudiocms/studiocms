//The MIT License (MIT)
//
//Copyright (c) 2015-16 jillix <contact@jillix.com>, https://github.com/jillix/piklor.js/
//Modified to work Copyright (c) 2020-21 Brendon Ngirazi
//Modified to Typescript Copyright (c) 2025 withstudiocms

interface ColorPickerOptions {
	open?: HTMLElement | string;
	openEvent?: string;
	style?: {
		display?: string;
		[key: string]: string | undefined;
	};
	template?: string;
	autoclose?: boolean;
	closeOnBlur?: boolean;
}

export default class ColorPicker {
	private elm: HTMLElement;
	private cbs: Array<(color: string) => void>;
	private color: string;
	private isOpen: boolean;
	private colors: string[];
	private options: ColorPickerOptions;
	private windowClickHandler?: (ev: MouseEvent) => void;

	/**
	 * ColorPicker
	 * Creates a new `ColorPicker` instance.
	 *
	 * @name ColorPicker
	 * @function
	 * @param {String|HTMLElement} sel The element where the color picker will live.
	 * @param {Array<string>} colors An array of strings representing colors.
	 * @param {Object} options An object containing the following fields:
	 *
	 *  - `open` (String|HTMLElement): The HTML element or query selector which will open the picker.
	 *  - `openEvent` (String): The open event (default: `"click"`).
	 *  - `style` (Object): Some style options:
	 *    - `display` (String): The display value when the picker is opened (default: `"block"`).
	 *  - `template` (String): The color item template. The `{color}` snippet will be replaced
	 *    with the color value (default: `"<div data-col=\"{color}\" style=\"background-color: {color}\"></div>"`).
	 *  - `autoclose` (Boolean): If `false`, the color picker will not be hided by default (default: `true`).
	 *  - `closeOnBlur` (Boolean): If `true`, the color picker will be closed when clicked outside of it (default: `false`).
	 *
	 * @return {ColorPicker} The `ColorPicker` instance.
	 */
	constructor(sel: string | HTMLElement, colors?: string[], options: ColorPickerOptions = {}) {
		const defaultColors = [
			'#1abc9c',
			'#2ecc71',
			'#3498db',
			'#9b59b6',
			'#34495e',
			'#16a085',
			'#27ae60',
			'#2980b9',
			'#8e44ad',
			'#2c3e50',
			'#f1c40f',
			'#e67e22',
			'#e74c3c',
			'#ecf0f1',
			'#95a5a6',
			'#f39c12',
			'#d35400',
			'#c0392b',
			'#bdc3c7',
			'#7f8c8d',
		];

		this.colors = colors || defaultColors;

		// Initialize options with defaults
		this.options = {
			openEvent: 'click',
			style: {
				display: 'block',
			},
			closeOnBlur: false,
			template: '<div data-col="{color}" style="background-color: {color}" title="{color}" ></div>',
			autoclose: true,
			...options,
		};

		// Convert open element string to HTML element if needed
		if (typeof this.options.open === 'string') {
			this.options.open = this.getElm(this.options.open);
		}

		// Initialize properties
		this.elm = this.getElm(sel);
		this.cbs = [];
		this.color = '';
		this.isOpen = true;

		this.render();

		// Handle the open element and event.
		if (this.options.open) {
			this.options.open.addEventListener(this.options.openEvent || 'click', () => {
				this.isOpen ? this.close() : this.open();
			});
		}

		// Click on colors
		this.elm.addEventListener('click', (ev: MouseEvent) => {
			const target = ev.target as HTMLElement;
			const col = target.getAttribute('data-col');
			if (!col) {
				return;
			}
			this.color = col;
			this.set(col);
			this.close();
		});

		if (this.options.closeOnBlur) {
			this.windowClickHandler = (ev: MouseEvent) => {
				const target = ev.target as HTMLElement;
				// check if we didn't click 'open' and 'color pallete' elements
				if (target !== this.options.open && target !== this.elm && this.isOpen) {
					this.close();
				}
			};
			window.addEventListener('click', this.windowClickHandler);
		}
	}

	/**
	 * destroy
	 * Cleans up event listeners and resources.
	 *
	 * @name destroy
	 * @function
	 */
	destroy(): void {
		if (this.windowClickHandler) {
			window.removeEventListener('click', this.windowClickHandler);
		}

		if (this.options.autoclose !== false) {
			this.close();
		}
	}

	/**
	 * getElm
	 * Finds the HTML element.
	 *
	 * @name getElm
	 * @function
	 * @param {String|HTMLElement} el The HTML element or query selector.
	 * @return {HTMLElement} The selected HTML element.
	 */
	private getElm(el: string | HTMLElement): HTMLElement {
		if (typeof el === 'string') {
			const element = document.querySelector(el);
			if (!element) {
				throw new Error(`Element ${el} not found`);
			}
			return element as HTMLElement;
		}
		return el;
	}

	/**
	 * render
	 * Renders the colors.
	 *
	 * @name render
	 * @function
	 */
	render(): void {
		let html = '';

		this.colors.forEach((color) => {
			html += this.options.template?.replace(/\{color\}/g, color) || '';
		});

		this.elm.innerHTML = html;
	}

	/**
	 * close
	 * Closes the color picker.
	 *
	 * @name close
	 * @function
	 */
	close(): void {
		this.elm.style.display = 'none';
		this.isOpen = false;
	}

	/**
	 * open
	 * Opens the color picker.
	 *
	 * @name open
	 * @function
	 */
	open(): void {
		this.elm.style.display = this.options.style?.display || 'block';
		this.isOpen = true;
	}

	/**
	 * colorChosen
	 * Adds a new callback in the colorChosen callback buffer.
	 *
	 * @name colorChosen
	 * @function
	 * @param {Function} cb The callback function called with the selected color.
	 */
	colorChosen(cb: (color: string) => void): void {
		this.cbs.push(cb);
	}

	/**
	 * set
	 * Sets the color picker color.
	 *
	 * @name set
	 * @function
	 * @param {String} c The color to set.
	 * @param {Boolean} p If `false`, the `colorChosen` callbacks will not be called.
	 */
	set(c: string, p = true): void {
		this.color = c;

		if (p === false) {
			return;
		}

		this.cbs.forEach((cb) => {
			cb?.(c);
		});
	}
}
