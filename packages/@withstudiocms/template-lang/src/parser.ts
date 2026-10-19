import type { TemplateVariable } from './types.js';

/**
 * Parses template strings to find variable placeholders
 */
export class TemplateParser {
	private static readonly VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

	/**
	 * Parse a template string to find all variables
	 * @param template The template string to parse
	 * @returns Array of found template variables
	 */
	static parse(template: string): TemplateVariable[] {
		const variables: TemplateVariable[] = [];
		let match: RegExpExecArray | null;

		// Reset regex state
		TemplateParser.VARIABLE_REGEX.lastIndex = 0;

		while ((match = TemplateParser.VARIABLE_REGEX.exec(template)) !== null) {
			const fullMatch = match[0]; // e.g., "{{name}}"
			const variableName = match[1].trim(); // e.g., "name"

			variables.push({
				match: fullMatch,
				name: variableName,
				start: match.index,
				end: match.index + fullMatch.length,
			});
		}

		return variables;
	}

	/**
	 * Check if a template contains any variables
	 * @param template The template string to check
	 * @returns True if template contains variables
	 */
	static hasVariables(template: string): boolean {
		TemplateParser.VARIABLE_REGEX.lastIndex = 0;
		return TemplateParser.VARIABLE_REGEX.test(template);
	}
}
