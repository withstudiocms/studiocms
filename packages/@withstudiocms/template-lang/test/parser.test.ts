import { describe, it, expect } from 'vitest';
import { TemplateParser } from '../src/parser.js';

describe('TemplateParser', () => {
    describe('parse', () => {
        it('should parse simple variables', () => {
            const result = TemplateParser.parse("Hello {{name}}!");

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                match: "{{name}}",
                name: "name",
                start: 6,
                end: 14
            });
        });

        it('should parse multiple variables', () => {
            const result = TemplateParser.parse("{{greeting}} {{name}}!");

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                match: "{{greeting}}",
                name: "greeting",
                start: 0,
                end: 12
            });
            expect(result[1]).toEqual({
                match: "{{name}}",
                name: "name",
                start: 13,
                end: 21
            });
        });

        it('should parse nested variables', () => {
            const result = TemplateParser.parse("{{user.name}} and {{user.email}}");

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("user.name");
            expect(result[1].name).toBe("user.email");
        });

        it('should handle variables with spaces', () => {
            const result = TemplateParser.parse("{{ spaced }}");

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("spaced");
        });

        it('should return empty array for no variables', () => {
            const result = TemplateParser.parse("No variables here");
            expect(result).toHaveLength(0);
        });

        it('should handle duplicate variables', () => {
            const result = TemplateParser.parse("{{name}} and {{name}} again");

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("name");
            expect(result[1].name).toBe("name");
        });
    });

    describe('hasVariables', () => {
        it('should return true when variables exist', () => {
            expect(TemplateParser.hasVariables("Hello {{name}}!")).toBe(true);
            expect(TemplateParser.hasVariables("{{start}} middle {{end}}")).toBe(true);
        });

        it('should return false when no variables exist', () => {
            expect(TemplateParser.hasVariables("Hello world!")).toBe(false);
            expect(TemplateParser.hasVariables("")).toBe(false);
            expect(TemplateParser.hasVariables("{ single brace }")).toBe(false);
        });
    });
});