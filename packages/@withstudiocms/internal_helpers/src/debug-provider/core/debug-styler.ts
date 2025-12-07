import { styleText } from 'node:util';

interface KeyValuePair {
	key: string;
	value: string;
}

type StyleTextFormatColor = Parameters<typeof styleText>[0];

type FormatOptions = {
	keyStyle?: StyleTextFormatColor;
	valueStyle?: StyleTextFormatColor;
};

export class DebugStyler {
	private indent: number;

	constructor(indent = 2) {
		this.indent = indent;
	}

	/**
	 * Format an object into aligned key-value pairs
	 */
	format(obj: Record<string, string>): string {
		const pairs: KeyValuePair[] = Object.entries(obj).map(([key, value]) => ({ key, value }));
		if (pairs.length === 0) return '';

		const maxKeyLength = Math.max(...pairs.map((p) => p.key.length));
		const lines: string[] = [];

		for (const { key, value } of pairs) {
			const padding = ' '.repeat(maxKeyLength - key.length + this.indent);
			const valueLines = value.split('\n');

			// First line with key
			lines.push(`${key}${padding}${valueLines[0]}`);

			// Additional lines indented to align with first value
			for (let i = 1; i < valueLines.length; i++) {
				const indent = ' '.repeat(maxKeyLength + this.indent);
				lines.push(`${indent}${valueLines[i]}`);
			}
		}

		return lines.join('\n');
	}

	/**
	 * Format and style an object with colors using Node.js styleText
	 */
	formatStyled(obj: Record<string, string>, options: FormatOptions = {}): string {
		const pairs: KeyValuePair[] = Object.entries(obj).map(([key, value]) => ({ key, value }));
		if (pairs.length === 0) return '';

		const maxKeyLength = Math.max(...pairs.map((p) => p.key.length));
		const lines: string[] = [];

		const keyStyle = options.keyStyle || 'cyan';
		const valueStyle = options.valueStyle || 'white';

		for (const { key, value } of pairs) {
			const padding = ' '.repeat(maxKeyLength - key.length + this.indent);
			const valueLines = value.split('\n');

			// Apply styles to key and value
			const styledKey = Array.isArray(keyStyle)
				? keyStyle.reduce((acc, style) => styleText(style, acc), key)
				: styleText(keyStyle, key);

			const styledValue = Array.isArray(valueStyle)
				? valueStyle.reduce((acc, style) => styleText(style, acc), valueLines[0])
				: styleText(valueStyle, valueLines[0]);

			// First line with key
			lines.push(`${styledKey}${padding}${styledValue}`);

			// Additional lines indented to align with first value
			for (let i = 1; i < valueLines.length; i++) {
				const indent = ' '.repeat(maxKeyLength + this.indent);
				const styledLine = Array.isArray(valueStyle)
					? valueStyle.reduce((acc, style) => styleText(style, acc), valueLines[i])
					: styleText(valueStyle, valueLines[i]);
				lines.push(`${indent}${styledLine}`);
			}
		}

		return lines.join('\n');
	}
}
