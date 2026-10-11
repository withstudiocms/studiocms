import { compile } from '@mdx-js/mdx';
import { describe, expect, test } from 'vitest';
import { restrictMdx } from '../../src/lib/restrict-mdx.js';

describe('restricted MDX compiler input', () => {
	test.each([
		['ESM imports', "import Component from './component.js'", 'Unsupported MDX syntax: mdxjsEsm'],
		['text expressions', 'Hello {globalThis.process}', 'Unsupported MDX syntax: mdxTextExpression'],
		['flow expressions', '{globalThis.process}', 'Unsupported MDX syntax: mdxFlowExpression'],
		['custom components', '<Button>not allowed</Button>', 'Unsupported MDX element: Button'],
		['dangerous HTML elements', '<script>alert(1)</script>', 'Unsupported MDX element: script'],
		[
			'dynamic HTML attributes',
			'<div data-value={globalThis.process} />',
			'only static HTML attributes are allowed',
		],
		[
			'event handler attributes',
			'<div onClick="alert(1)" />',
			'Unsupported MDX HTML attribute: onClick',
		],
		[
			'scriptable URLs',
			'<a href="javascript:alert(1)">click</a>',
			'Unsafe URL in MDX HTML attribute: href',
		],
	])('rejects %s', async (_label, content, expectedError) => {
		await expect(
			compile(content, {
				outputFormat: 'function-body',
				remarkPlugins: [restrictMdx],
			})
		).rejects.toThrow(expectedError);
	});

	test('allows safe static HTML elements', async () => {
		await expect(
			compile('<div className="box" title="safe">allowed HTML</div>', {
				outputFormat: 'function-body',
				remarkPlugins: [restrictMdx],
			})
		).resolves.toBeDefined();
	});

	test('continues to compile regular Markdown and GFM', async () => {
		await expect(
			compile('# Heading\n\n- [x] safe Markdown', {
				outputFormat: 'function-body',
				remarkPlugins: [restrictMdx],
			})
		).resolves.toBeDefined();
	});
});
