import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../src/engine.js';

describe('TemplateEngine', () => {
    const engine = new TemplateEngine();

    describe('Basic functionality', () => {
        it('should replace basic variables', () => {
            const result = engine.render("Hello {{name}}!", { name: "World" });
            expect(result).toBe("Hello World!");
        });

        it('should handle nested property access', () => {
            const result = engine.render(
                "{{user.name}} works at {{user.company}}",
                { user: { name: "John", company: "Acme" } }
            );
            expect(result).toBe("John works at Acme");
        });

        it('should handle multiple variables', () => {
            const result = engine.render(
                "{{greeting}} {{name}}, {{message}}",
                { greeting: "Hello", name: "Alice", message: "welcome!" }
            );
            expect(result).toBe("Hello Alice, welcome!");
        });

        it('should handle missing variables in non-strict mode', () => {
            const result = engine.render(
                "Hello {{name}}! Your age is {{age}}.",
                { name: "Bob" }
            );
            expect(result).toBe("Hello Bob! Your age is .");
        });

        it('should handle empty templates', () => {
            const result = engine.render("", { name: "test" });
            expect(result).toBe("");
        });

        it('should handle templates with no variables', () => {
            const result = engine.render(
                "This is just plain text",
                { name: "test" }
            );
            expect(result).toBe("This is just plain text");
        });

        it('should handle deep nesting', () => {
            const result = engine.render(
                "{{a.b.c.d}}",
                { a: { b: { c: { d: "deep" } } } }
            );
            expect(result).toBe("deep");
        });
    });

    describe('Template compilation', () => {
        it('should compile templates for reuse', () => {
            const compiled = engine.compile("Hello {{name}}!");

            const result1 = compiled({ name: "Alice" });
            const result2 = compiled({ name: "Bob" });

            expect(result1).toBe("Hello Alice!");
            expect(result2).toBe("Hello Bob!");
        });
    });

    describe('Variable detection', () => {
        it('should detect if template has variables', () => {
            expect(engine.hasVariables("Hello {{name}}!")).toBe(true);
            expect(engine.hasVariables("Hello world!")).toBe(false);
        });

        it('should extract variable names from template', () => {
            const variables = engine.getVariables("Hello {{name}}! You have {{count}} messages from {{sender.name}}.");
            expect(variables).toEqual(["name", "count", "sender.name"]);
        });

        it('should remove duplicate variable names', () => {
            const variables = engine.getVariables("{{name}} {{name}} {{other}}");
            expect(variables).toEqual(["name", "other"]);
        });
    });

    describe('Strict mode', () => {
        it('should throw error for missing variables in strict mode', () => {
            const strictEngine = new TemplateEngine({ strict: true });

            expect(() => {
                strictEngine.render("Hello {{missingVariable}}!", { name: "John" });
            }).toThrow("Template variable 'missingVariable' not found in data context");
        });
    });

    describe('Default values', () => {
        it('should use default value for missing variables', () => {
            const engineWithDefault = new TemplateEngine({ defaultValue: "[NOT SET]" });

            const result = engineWithDefault.render(
                "Hello {{name}}! Your role is {{role}}.",
                { name: "Alice" }
            );

            expect(result).toBe("Hello Alice! Your role is [NOT SET].");
        });
    });

    describe('Options management', () => {
        it('should allow updating options after creation', () => {
            const testEngine = new TemplateEngine();

            // First with default behavior
            let result = testEngine.render("Hello {{missing}}!", {});
            expect(result).toBe("Hello !");

            // Update to use default value
            testEngine.setOptions({ defaultValue: "[MISSING]" });
            result = testEngine.render("Hello {{missing}}!", {});
            expect(result).toBe("Hello [MISSING]!");
        });
    });
});