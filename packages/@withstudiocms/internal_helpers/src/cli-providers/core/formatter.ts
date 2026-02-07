import { styleText } from 'node:util';
import type { TextFormatter } from '../definitions';

interface KeyValuePair {
	key: string;
	value: string;
}

type StyleTextFormatColor = Parameters<typeof styleText>[0];

/**
 * Options for formatting and styling debug information.
 */
export type FormatOptions = {
	keyStyle: StyleTextFormatColor;
	valueStyle: StyleTextFormatColor;
};

export type DebugStylerOptions = {
	indent?: number;
	style?: FormatOptions;
};

/**
 * A utility class for formatting and styling debug information.
 */
export class Formatter implements TextFormatter {
	#indent: number;
	#obj: Record<string, string>;
	#style: FormatOptions;

	constructor(obj: Record<string, string>, opts?: DebugStylerOptions) {
		this.#indent = opts?.indent ?? 2;
		this.#obj = obj;
		this.#style = opts?.style ?? {
			keyStyle: 'cyan',
			valueStyle: 'white',
		};
	}

	get #getKeyPair(): KeyValuePair[] {
		return Object.entries(this.#obj).map(([key, value]) => ({ key, value }));
	}

	#textProcessor(text: string, type: 'key' | 'value', styled?: boolean): string {
		const style = type === 'key' ? this.#style.keyStyle : this.#style.valueStyle;
		return styled ? styleText(style, text) : text;
	}

	#getTextProcessor(styled?: boolean) {
		return (text: string, type: 'key' | 'value') => this.#textProcessor(text, type, styled);
	}

	format(styled?: boolean): string {
		const pairs = this.#getKeyPair;
		if (pairs.length === 0) return '';

		const maxKeyLength = Math.max(...pairs.map((p) => p.key.length));
		const lines: string[] = [];

		const processText = this.#getTextProcessor(styled);

		for (const { key, value } of pairs) {
			const padding = ' '.repeat(maxKeyLength - key.length + this.#indent);
			const valueLines = value.split('\n');

			// Apply styles to key and value if styled is true
			const styledKey = processText(key, 'key');
			const styledValue = processText(valueLines[0], 'value');

			// First line with key
			lines.push(`${styledKey}${padding}${styledValue}`);

			// Additional lines indented to align with first value
			for (let i = 1; i < valueLines.length; i++) {
				const indent = ' '.repeat(maxKeyLength + this.#indent);
				const styledLine = processText(valueLines[i], 'value');
				lines.push(`${indent}${styledLine}`);
			}
		}

		return lines.join('\n');
	}
}
