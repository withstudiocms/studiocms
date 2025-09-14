import type { SSRResult } from 'astro';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createComponentProxy } from '../../src/component-proxy/index.js';

describe('createComponentProxy', () => {
	let result: SSRResult;

	beforeEach(() => {
		result = {} as SSRResult;
	});

	it('returns an empty object if no components are provided', () => {
		const proxy = createComponentProxy(result);
		expect(proxy).toEqual(Object.create(null));
	});

	it('proxies string components directly', () => {
		const proxy = createComponentProxy(result, { Foo: 'bar' });
		expect(proxy.foo).toBe('bar');
	});

	it('proxies function components correctly', async () => {
		const proxy = createComponentProxy(result, {
			MyComponent: (props: any, children: any) => {
				return `<div>${props.text} - ${children?.value || ''}</div>`;
			},
		});

		expect(proxy.mycomponent).toBeDefined();
		expect(typeof proxy.mycomponent).toBe('function');
	});

	it('proxies function components and processes props and children', async () => {
		const mockRenderJSX = vi.fn().mockResolvedValue('<div>hello - world</div>');
		const mockJSX = vi.fn().mockReturnValue('<div></div>');
		const mockUnsafeHTML = vi.fn().mockReturnValue('<div>hello - world</div>');

		const proxy = createComponentProxy(
			result,
			{
				MyComponent: (props: any, children: any) => {
					return `<div>${props.text} - ${children?.value || ''}</div>`;
				},
			},
			{
				renderJSX: mockRenderJSX,
				jsx: mockJSX,
				__unsafeHTML: mockUnsafeHTML,
			}
		);

		const output = await proxy.mycomponent({ text: 'hello' }, { value: 'world' });

		expect(mockJSX).toHaveBeenCalledWith(expect.any(Function), {
			text: 'hello',
			'set:html': 'world',
		});
		expect(mockRenderJSX).toHaveBeenCalledWith(result, '<div></div>');
		expect(mockUnsafeHTML).toHaveBeenCalledWith('<div>hello - world</div>');
		expect(output).toBe('<div>hello - world</div>');
	});
});
