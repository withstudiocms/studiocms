# @withstudiocms/template-lang

A simple TypeScript ESM template language for HTML emails, similar to Handlebars but focused on simplicity and database data integration.

## Features

- 🚀 Simple `{{variable}}` syntax for variable interpolation
- 🔍 Support for nested properties with dot notation (`{{user.name}}`)
- ⚡ TypeScript with full ESM support
- 🛡️ Strict mode for error handling
- 🎯 Designed specifically for email templates and DB data
- 📦 Zero dependencies

## Installation

```bash
npm install @withstudiocms/template-lang
```

## Basic Usage

```typescript
import TemplateEngine from '@withstudiocms/template-lang';

const engine = new TemplateEngine();

const template = "Hello {{name}}! Welcome to {{company.name}}.";
const data = {
    name: "John Doe",
    company: {
        name: "Acme Corp"
    }
};

const result = engine.render(template, data);
console.log(result); // "Hello John Doe! Welcome to Acme Corp."
```

## Template Syntax

### Variable Interpolation
```html
<h1>Hello {{user.firstName}} {{user.lastName}}!</h1>
<p>Your order #{{order.id}} total is ${{order.total}}</p>
```

### Nested Properties
```html
<p>Shipping to: {{user.address.street}}, {{user.address.city}}</p>
```

## API Reference

### TemplateEngine

#### Constructor
```typescript
new TemplateEngine(options?: TemplateOptions)
```

#### Methods

**`render(template: string, data: TemplateData): string`**
Renders a template with the provided data.

**`compile(template: string): (data: TemplateData) => string`**
Compiles a template into a reusable function.

**`hasVariables(template: string): boolean`**
Checks if a template contains any variables.

**`getVariables(template: string): string[]`**
Returns an array of all variable names in the template.

**`setOptions(options: Partial<TemplateOptions>): void`**
Updates the engine options.

### Options

```typescript
interface TemplateOptions {
    strict?: boolean;      // Throw error on missing variables (default: false)
    defaultValue?: string; // Default value for missing variables (default: '')
}
```

## Examples

### Email Template
```typescript
const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>{{subject}}</title>
</head>
<body>
    <h1>Hello {{user.name}}!</h1>
    <p>Your order #{{order.id}} has been confirmed.</p>
    <p>Total: {{order.total}}</p>
</body>
</html>
`;

const data = {
    subject: "Order Confirmation",
    user: { name: "John Doe" },
    order: { id: "12345", total: "99.99" }
};

const html = engine.render(emailTemplate, data);
```

### Strict Mode
```typescript
const strictEngine = new TemplateEngine({ strict: true });

// This will throw an error if 'missingVar' is not in data
try {
    const result = strictEngine.render("Hello {{missingVar}}!", {});
} catch (error) {
    console.log("Variable not found:", error.message);
}
```

### Default Values
```typescript
const engine = new TemplateEngine({ defaultValue: "[NOT SET]" });
const result = engine.render("Hello {{name}}!", {});
// Result: "Hello [NOT SET]!"
```

### Template Compilation
```typescript
// Compile once, use multiple times
const compiled = engine.compile("Hello {{name}}!");

const result1 = compiled({ name: "Alice" });
const result2 = compiled({ name: "Bob" });
```

## Use Cases

Perfect for:
- HTML email templates
- Dynamic content generation from database data
- Simple templating needs without complex logic
- ESM-first TypeScript projects

## License

MIT
