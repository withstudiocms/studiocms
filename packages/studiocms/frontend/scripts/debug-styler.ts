interface KeyValuePair {
	key: string;
	value: string;
}

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
}
