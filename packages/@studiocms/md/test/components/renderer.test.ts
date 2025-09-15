/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import Renderer from '../../src/components/markdown-render.astro';

describe('Renderer component', () => {
	beforeAll(() => {
		vi.resetModules();
		vi.resetAllMocks();
	});

	test.each([
		[{ data: { defaultContent: { content: '# Renderer content' } } }, '# Renderer content'],
		[{ data: { defaultContent: { content: '' } } }, '# Error: No content found'],
		[{ data: { defaultContent: {} } }, '# Error: No content found'],
		[{ data: {} }, '# Error: No content found'],
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
