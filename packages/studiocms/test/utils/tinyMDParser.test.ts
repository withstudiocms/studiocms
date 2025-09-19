import { describe, expect, it } from 'vitest';
import { parseMarkdown } from '../../src/utils/tinyMDParser';

describe('parseMarkdown', () => {
	it('renders basic markdown to HTML', () => {
		const md = '# Hello World';
		const html = parseMarkdown(md);
		expect(html).toContain('<h1>Hello World</h1>');
	});

	it('renders GFM tables', () => {
		const md = `
| Foo | Bar |
| --- | --- |
| baz | qux |
`;
		const html = parseMarkdown(md);
		expect(html).toContain('<table>');
		expect(html).toContain('<td>baz</td>');
		expect(html).toContain('<td>qux</td>');
	});

	it('renders GFM task lists', () => {
		const md = `
- [x] Done
- [ ] Not done
`;
		const html = parseMarkdown(md);
		expect(html).toContain('type="checkbox"');
		expect(html).toContain('checked');
	});

	it('renders links and emphasis', () => {
		const md = '[StudioCMS](https://studiocms.dev) is *awesome*!';
		const html = parseMarkdown(md);
		expect(html).toContain('<a href="https://studiocms.dev">StudioCMS</a>');
		expect(html).toContain('<em>awesome</em>');
	});

	it('returns empty string for empty input', () => {
		const html = parseMarkdown('');
		expect(html).toBe('');
	});
});
