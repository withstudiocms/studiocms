import { styleText } from 'node:util';

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
export class DebugStyler {
	private indent: number;
	private obj: Record<string, string>;
	private style: FormatOptions;

	constructor(obj: Record<string, string>, opts?: DebugStylerOptions) {
		this.indent = opts?.indent ?? 2;
		this.obj = obj;
		this.style = opts?.style ?? {
			keyStyle: 'cyan',
			valueStyle: 'white',
		};
	}

	get #data(): KeyValuePair[] {
		return Object.entries(this.obj).map(([key, value]) => ({ key, value }));
	}

	format(styled?: boolean) {
		const pairs = this.#data;
		if (pairs.length === 0) return '';

		const maxKeyLength = Math.max(...pairs.map((p) => p.key.length));
		const lines: string[] = [];

		for (const { key, value } of pairs) {
			const padding = ' '.repeat(maxKeyLength - key.length + this.indent);
			const valueLines = value.split('\n');

			// Apply styles to key and value if styled is true
			const styledKey = styled ? styleText(this.style.keyStyle, key) : key;

			const styledValue = styled ? styleText(this.style.valueStyle, valueLines[0]) : valueLines[0];

			// First line with key
			lines.push(`${styledKey}${padding}${styledValue}`);

			// Additional lines indented to align with first value
			for (let i = 1; i < valueLines.length; i++) {
				const indent = ' '.repeat(maxKeyLength + this.indent);
				const styledLine = styled ? styleText(this.style.valueStyle, valueLines[i]) : valueLines[i];
				lines.push(`${indent}${styledLine}`);
			}
		}

		return lines.join('\n');
	}
}
