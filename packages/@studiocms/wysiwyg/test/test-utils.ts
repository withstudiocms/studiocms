import type { PluginPageTypeRendererProps } from 'studiocms/types';

export interface WYSIWYGRendererProps extends PluginPageTypeRendererProps {}

export const createMockProps = (content?: string | null): WYSIWYGRendererProps => ({
	data: {
		defaultContent: {
			id: 'test-id',
			content: content,
			contentLang: 'en',
			contentId: 'test-content-id',
		},
	},
});

export const createEmptyProps = (): WYSIWYGRendererProps => ({
	data: {},
});

export const createNullContentProps = (): WYSIWYGRendererProps => ({
	data: {
		defaultContent: {
			id: 'test-id',
			content: null,
			contentLang: 'en',
			contentId: 'test-content-id',
		},
	},
});

export const createUndefinedContentProps = (): WYSIWYGRendererProps => ({
	data: {
		defaultContent: {
			id: 'test-id',
			content: undefined,
			contentLang: 'en',
			contentId: 'test-content-id',
		},
	},
});

export const createWhitespaceProps = (): WYSIWYGRendererProps => ({
	data: {
		defaultContent: {
			id: 'test-id',
			content: '   \n\t   ',
			contentLang: 'en',
			contentId: 'test-content-id',
		},
	},
});

export const sampleWYSIWYGContent = `<div class="container">
	<h1>Hello World</h1>
	<p>This is a <strong>bold</strong> text with a <a href="https://example.com">link</a>.</p>
	
	<div class="callout info">
		<p>This is a callout block with HTML content.</p>
	</div>
	
	<h2>Code Example</h2>
	<pre><code class="language-javascript">
const greeting = "Hello, World!";
console.log(greeting);
	</code></pre>
	
	<h3>List Items</h3>
	<ul>
		<li>First item</li>
		<li>Second item</li>
		<li>Third item</li>
	</ul>
	
	<div class="conditional">
		<p>This is conditional content.</p>
	</div>
</div>`;

export const complexWYSIWYGContent = `<div class="main-content">
	<h1>Main Title</h1>
	
	<h2>Subtitle</h2>
	<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
	
	<h3>Features</h3>
	
	<div class="callout warning">
		<p>Important notice here!</p>
	</div>
	
	<ul>
		<li>Feature 1</li>
		<li>Feature 2</li>
		<li>Feature 3</li>
	</ul>
	
	<p><a href="https://example.com">External link</a></p>
	
	<pre><code class="language-typescript">
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
	</code></pre>
	
	<div class="user-greeting">
		<p>Welcome, John Doe!</p>
	</div>
</div>`;

export const malformedHTMLContent = `<div class="unclosed">
	<h1>Unclosed heading
	<p>Paragraph without closing tag
	<a href="https://example.com">Link without closing tag
</div>`;

export const scriptInjectionContent = `<div>
	<h1>Safe Content</h1>
	<script>alert('XSS Attack!');</script>
	<p>This should be sanitized</p>
	<img src="x" onerror="alert('XSS')" />
</div>`;

export const mockSanitizeOptions = {
	allowElements: ['div', 'h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'ul', 'li', 'pre', 'code'],
	allowAttributes: {
		'*': ['class'],
		a: ['href'],
		img: ['src', 'alt'],
	},
	allowedSchemes: ['http', 'https'],
};
