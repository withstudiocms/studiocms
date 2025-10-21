/** biome-ignore-all lint/suspicious/noExplicitAny: allowed in tests */

import * as allure from 'allure-js-commons';
import type { SSRResult } from 'astro';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createComponentProxy } from '../../src/component-proxy/index.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'Component Proxy Tests';

describe(parentSuiteName, () => {
	let result: SSRResult;

	beforeEach(() => {
		result = {} as SSRResult;
	});

	[
		{
			input: {},
			expected: Object.create(null),
		},
		{
			input: { Foo: 'bar' },
			expected: { foo: 'bar' },
		},
	].forEach(({ input, expected }) => {
		test(`createComponentProxy with input: ${JSON.stringify(input)}`, async () => {
			await allure.parentSuite(parentSuiteName);
			await allure.suite(localSuiteName);
			await allure.subSuite('createComponentProxy Tests');
			await allure.tags(...sharedTags);

			await allure.step('Create component proxy', async () => {
				const proxy = createComponentProxy(result, input);
				expect(proxy).toEqual(expected);
			});
		});
	});

	test('createComponentProxy - proxies function components and processes props and children', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createComponentProxy Tests');
		await allure.tags(...sharedTags);

		await allure.step('Create component proxy and verify function component behavior', async () => {
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

	test('createComponentProxy - decodes code prop for CodeBlock and CodeSpan components', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createComponentProxy Tests');
		await allure.tags(...sharedTags);

		const encoded = btoa('console.log("Hello, World!");');
		const mockRenderJSX = vi.fn().mockResolvedValue('<pre>console.log("Hello, World!");</pre>');
		const mockJSX = vi.fn().mockReturnValue('<pre></pre>');
		const mockUnsafeHTML = vi.fn().mockReturnValue('<pre>console.log("Hello, World!");</pre>');

		await allure.step('Create component proxy and verify code decoding', async () => {
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
	});

	test('createComponentProxy - handles decoding errors gracefully', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('createComponentProxy Tests');
		await allure.tags(...sharedTags);

		const invalidEncoded = '!!!invalid-base64!!!';
		const mockRenderJSX = vi.fn().mockResolvedValue('<pre>!!!invalid-base64!!!</pre>');
		const mockJSX = vi.fn().mockReturnValue('<pre></pre>');
		const mockUnsafeHTML = vi.fn().mockReturnValue('<pre>!!!invalid-base64!!!</pre>');

		await allure.step('Create component proxy and verify decoding error handling', async () => {
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
		});
	});
});
