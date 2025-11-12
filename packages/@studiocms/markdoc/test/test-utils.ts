/** biome-ignore-all lint/suspicious/noExplicitAny: allowed for tests */
import type { PluginPageTypeRendererProps } from 'studiocms/types';

export const parentSuiteName = '@studiocms/markdoc Package Tests';
export const sharedTags = ['package:@studiocms/markdoc', 'type:unit', 'scope:studiocms'];

export interface MarkDocRendererProps extends PluginPageTypeRendererProps {}

export const createMockProps = (content?: string | null): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: content || null,
		} as any,
	},
});

export const createEmptyProps = (): MarkDocRendererProps => ({
	data: {},
});

export const createNullContentProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: null,
		} as any,
	},
});

export const createUndefinedContentProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: undefined,
		} as any,
	},
});

export const createWhitespaceProps = (): MarkDocRendererProps => ({
	data: {
		defaultContent: {
			content: '   \n\t   ',
		} as any,
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
