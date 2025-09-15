/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Editor from '../../src/components/editor.astro';

describe('Editor component', () => {
	test('Editor with props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Editor, {
			props: {
				content: 'Editor content',
			},
		});

		expect(result).toContain('<div class="editor-container"');
		expect(result).toContain('<textarea id="page-content" name="page-content"');
		expect(result).toContain('Editor content');
		expect(result).toContain('</textarea>');
		expect(result).toContain('</div>');
		expect(result).toContain('<script type="module" src=');
		expect(result).toContain('</script>');
	});
});
