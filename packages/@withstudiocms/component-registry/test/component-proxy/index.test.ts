/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */
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

	it('decodes code prop for CodeBlock and CodeSpan components', async () => {
		const encoded = btoa('console.log("Hello, World!");');
		const mockRenderJSX = vi.fn().mockResolvedValue('<pre>console.log("Hello, World!");</pre>');
		const mockJSX = vi.fn().mockReturnValue('<pre></pre>');
		const mockUnsafeHTML = vi.fn().mockReturnValue('<pre>console.log("Hello, World!");</pre>');

		const proxy = createComponentProxy(
			result,
			{
				CodeBlock: (props: any) => {
					return `<pre>${props.code}</pre>`;
				},
				CodeSpan: (props: any) => {
					return `<code>${props.code}</code>`;
				},
			},
			{
				renderJSX: mockRenderJSX,
				jsx: mockJSX,
				__unsafeHTML: mockUnsafeHTML,
			}
		);

		const outputBlock = await proxy.codeblock({ code: encoded }, null);
		expect(mockRenderJSX).toHaveBeenCalledWith(result, '<pre></pre>');
		expect(mockUnsafeHTML).toHaveBeenCalledWith('<pre>console.log("Hello, World!");</pre>');
		expect(outputBlock).toBe('<pre>console.log("Hello, World!");</pre>');

		const outputSpan = await proxy.codespan({ code: encoded }, null);
		expect(mockRenderJSX).toHaveBeenCalledWith(result, '<pre></pre>');
		expect(mockUnsafeHTML).toHaveBeenCalledWith('<pre>console.log("Hello, World!");</pre>');
		expect(outputSpan).toBe('<pre>console.log("Hello, World!");</pre>');
	});

	it('handles decoding errors gracefully', async () => {
		const invalidEncoded = '!!!invalid-base64!!!';
		const mockRenderJSX = vi.fn().mockResolvedValue('<pre>!!!invalid-base64!!!</pre>');
		const mockJSX = vi.fn().mockReturnValue('<pre></pre>');
		const mockUnsafeHTML = vi.fn().mockReturnValue('<pre>!!!invalid-base64!!!</pre>');
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const proxy = createComponentProxy(
			result,
			{
				CodeBlock: (props: any) => {
					return `<pre>${props.code}</pre>`;
				},
			},
			{
				renderJSX: mockRenderJSX,
				jsx: mockJSX,
				__unsafeHTML: mockUnsafeHTML,
			}
		);

		const output = await proxy.codeblock({ code: invalidEncoded }, null);
		expect(mockJSX).toHaveBeenCalledWith(expect.any(Function), {
			code: '!!!invalid-base64!!!',
			'set:html': undefined,
		});
		expect(mockRenderJSX).toHaveBeenCalledWith(result, '<pre></pre>');
		expect(mockUnsafeHTML).toHaveBeenCalledWith('<pre>!!!invalid-base64!!!</pre>');
		expect(output).toBe('<pre>!!!invalid-base64!!!</pre>');

		consoleWarnSpy.mockRestore();
	});
});
