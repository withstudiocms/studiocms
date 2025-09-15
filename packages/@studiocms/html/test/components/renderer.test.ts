/// <reference types="astro/client" />
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Renderer from '../../src/components/renderer.astro';

describe('Renderer component', () => {
	test('Renderer with props', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, {
			props: {
				data: {
					defaultContent: {
						content: '<p>Renderer content</p>',
					},
				},
			},
		});

		expect(result).toBe('<p>Renderer content</p>');
	});

	test('Renderer with empty content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, {
			props: {
				data: {
					defaultContent: {
						content: '',
					},
				},
			},
		});

		expect(result).toBe('<h1>Error: No content found</h1>');
	});

	test('Renderer with no content', async () => {
		const container = await AstroContainer.create();
		const result = await container.renderToString(Renderer, {
			props: {
				data: {
					defaultContent: {},
				},
			},
		});

		expect(result).toBe('<h1>Error: No content found</h1>');
	});
});
