/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Renderer from '../../src/components/renderer.astro';

describe('Renderer component', () => {
	test.each([
		[
			{ data: { defaultContent: { content: '<p>Renderer content</p>' } } },
			'<p>Renderer content</p>',
		],
		[{ data: { defaultContent: { content: '' } } }, '<h1>Error: No content found</h1>'],
		[{ data: { defaultContent: {} } }, '<h1>Error: No content found</h1>'],
		[{ data: {} }, '<h1>Error: No content found</h1>'],
	])('Renderer with props %#', async (props, expected) => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, { props });
		expect(result.trim()).toBe(expected);
	});

	test('Renderer throws with no props', async () => {
		const container = await AstroContainer.create();
		await expect(container.renderToString(Renderer)).rejects.toThrow();
	});
});
