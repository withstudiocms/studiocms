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
	 * Parse input text into key-value pairs
	 */
	private parse(input: string): KeyValuePair[] {
		const lines = input.split('\n').filter((line) => line.trim());
		const pairs: KeyValuePair[] = [];
		let currentKey: string | null = null;
		let currentValues: string[] = [];

		for (const line of lines) {
			const match = line.match(/^([^:=]+)[:=](.+)$/);

			if (match) {
				// Save previous key-value if exists
				if (currentKey) {
					pairs.push({
						key: currentKey,
						value: currentValues.join('\n'),
					});
				}

				// Start new key-value
				currentKey = match[1].trim();
				currentValues = [match[2].trim()];
			} else if (currentKey) {
				// Continuation line for current key
				currentValues.push(line.trim());
			}
		}

		// Don't forget the last pair
		if (currentKey) {
			pairs.push({
				key: currentKey,
				value: currentValues.join('\n'),
			});
		}

		return pairs;
	}

	/**
	 * Format key-value pairs with aligned spacing
	 */
	private formatter(pairs: KeyValuePair[]): string {
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
	 * Format key-value pairs with aligned spacing
	 */
	format(input: string): string {
		const pairs = this.parse(input);
		return this.formatter(pairs);
	}

	/**
	 * Format an object into aligned key-value pairs
	 */
	formatObject(obj: Record<string, string>): string {
		const pairs: KeyValuePair[] = Object.entries(obj).map(([key, value]) => ({ key, value }));
		return this.formatter(pairs);
	}
}
