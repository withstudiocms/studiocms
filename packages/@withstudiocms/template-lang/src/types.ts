/**
 * Data context for template rendering
 */
export type TemplateData = Record<string, any>;

/**
 * Options for template rendering
 */
export interface TemplateOptions {
    /**
     * Whether to throw an error when a variable is not found in the data
     * @default false
     */
    strict?: boolean;

    /**
     * Default value to use when a variable is not found and strict is false
     * @default ''
     */
    defaultValue?: string;
}

/**
 * A parsed template variable
 */
export interface TemplateVariable {
    /** The full match including braces (e.g., "{{name}}") */
    match: string;
    /** The variable name (e.g., "name") */
    name: string;
    /** Start position in the template string */
    start: number;
    /** End position in the template string */
    end: number;
}