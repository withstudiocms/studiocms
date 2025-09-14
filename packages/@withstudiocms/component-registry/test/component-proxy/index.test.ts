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
});
