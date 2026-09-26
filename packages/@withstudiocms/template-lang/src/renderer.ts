import { TemplateParser } from './parser.js';
import type { TemplateData, TemplateOptions } from './types.js';

/**
 * Renders templates by replacing variables with data
 */
export class TemplateRenderer {
	private options: Required<TemplateOptions>;

	constructor(options: TemplateOptions = {}) {
		this.options = {
			strict: options.strict ?? false,
			defaultValue: options.defaultValue ?? '',
		};
	}

	/**
	 * Render a template with the provided data
	 * @param template The template string to render
	 * @param data The data context for variable replacement
	 * @returns The rendered template string
	 */
	render(template: string, data: TemplateData): string {
		const variables = TemplateParser.parse(template);

		if (variables.length === 0) {
			return template;
		}

		// Sort variables by position (descending) to avoid index shifting during replacement
		variables.sort((a, b) => b.start - a.start);

		let result = template;

		for (const variable of variables) {
			const value = this.resolveValue(variable.name, data);
			result = result.substring(0, variable.start) + value + result.substring(variable.end);
		}

		return result;
	}

	/**
	 * Resolve a variable value from the data context
	 * @param variableName The name of the variable to resolve
	 * @param data The data context
	 * @returns The resolved value as a string
	 */
	private resolveValue(variableName: string, data: TemplateData): string {
		// Support nested properties using dot notation (e.g., "user.name")
		const value = this.getNestedValue(data, variableName);

		if (value === undefined || value === null) {
			if (this.options.strict) {
				throw new Error(`Template variable '${variableName}' not found in data context`);
			}
			return this.options.defaultValue;
		}

		// Convert to string
		return String(value);
	}

	/**
	 * Get a nested value from an object using dot notation
	 * @param obj The object to search in
	 * @param path The dot-separated path (e.g., "user.name")
	 * @returns The found value or undefined
	 */
	// biome-ignore lint/suspicious/noExplicitAny: this is intentional
	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => {
			return current && current[key] !== undefined ? current[key] : undefined;
		}, obj);
	}

	/**
	 * Update renderer options
	 * @param options New options to merge
	 */
	setOptions(options: Partial<TemplateOptions>): void {
		this.options = { ...this.options, ...options };
	}
}
