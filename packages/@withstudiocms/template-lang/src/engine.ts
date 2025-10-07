import type { TemplateData, TemplateOptions } from './types.js';
import { TemplateRenderer } from './renderer.js';
import { TemplateParser } from './parser.js';

/**
 * Main template engine class that provides a simple API for template rendering
 */
export class TemplateEngine {
    private renderer: TemplateRenderer;

    constructor(options: TemplateOptions = {}) {
        this.renderer = new TemplateRenderer(options);
    }

    /**
     * Render a template string with data
     * @param template The template string containing {{variable}} placeholders
     * @param data The data context for variable replacement
     * @returns The rendered template string
     */
    render(template: string, data: TemplateData): string {
        return this.renderer.render(template, data);
    }

    /**
     * Check if a template string contains any variables
     * @param template The template string to check
     * @returns True if the template contains variables
     */
    hasVariables(template: string): boolean {
        return TemplateParser.hasVariables(template);
    }

    /**
     * Get all variable names from a template
     * @param template The template string to analyze
     * @returns Array of variable names found in the template
     */
    getVariables(template: string): string[] {
        const variables = TemplateParser.parse(template);
        return [...new Set(variables.map(v => v.name))]; // Remove duplicates
    }

    /**
     * Update engine options
     * @param options New options to merge with current options
     */
    setOptions(options: Partial<TemplateOptions>): void {
        this.renderer.setOptions(options);
    }

    /**
     * Create a template function that can be reused with different data
     * @param template The template string
     * @returns A function that takes data and returns rendered template
     */
    compile(template: string): (data: TemplateData) => string {
        return (data: TemplateData) => this.render(template, data);
    }
}