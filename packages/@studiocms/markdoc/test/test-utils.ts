import type { PluginPageTypeRendererProps } from 'studiocms/types';

export interface MarkDocRendererProps extends PluginPageTypeRendererProps {}

export const createMockProps = (content?: string | null): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: content || null,
		},
	},
});

export const createEmptyProps = (): MarkDocRendererProps => ({
	data: {},
});

export const createNullContentProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: null,
		},
	},
});

export const createUndefinedContentProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: undefined,
		},
	},
});

export const createWhitespaceProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: '   \n\t   ',
		},
	},
});

export const sampleMarkdocContent = `# Hello World

This is **bold** text with a [link](https://example.com).

{% callout type="info" %}
This is a callout block with Markdoc syntax.
{% /callout %}

## Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### List Items

- First item
- Second item
- Third item

{% if true %}
This is conditional content.
{% /if %}`;

export const complexMarkdocContent = `# Main Title

## Subtitle

This is a paragraph with **bold** and *italic* text.

### Features

{% callout type="warning" %}
Important notice here!
{% /callout %}

- Feature 1
- Feature 2
- Feature 3

[External link](https://example.com)

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
\`\`\`

{% if user %}
Welcome, {{ user.name }}!
{% /if %}`;
