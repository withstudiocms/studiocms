import type { SSRResult } from 'astro';
import { jsx } from 'astro/jsx-runtime';
import { renderJSX } from 'astro/runtime/server/jsx.js';
import { __unsafeHTML } from 'ultrahtml';
import type { AstroComponentChildren, AstroProps, ComponentType } from '../types.js';
import { decode } from './decoder/index.js';

export * from './decoder/index.js';

/**
 * Creates a proxy for components that can either be strings or functions.
 * If the component is a string, it is directly assigned to the proxy.
 * If the component is a function, it is wrapped in an async function that
 * processes the props and children before rendering.
 *
 * @param result - The result object used for rendering JSX.
 * @param _components - An optional record of components to be proxied. Defaults to an empty object.
 * @returns A record of proxied components.
 */
export function createComponentProxy(result: SSRResult, _components: ComponentType = {}) {
	// Avoid prototype pollution on special keys like __proto__/constructor
	const components: ComponentType = Object.create(null);
	for (const [rawKey, value] of Object.entries(_components)) {
		const lowerKey = rawKey.toLowerCase();
		if (typeof value === 'string') {
			components[lowerKey] = value;
		} else {
			components[lowerKey] = async (props: AstroProps, children: AstroComponentChildren) => {
				if (lowerKey === 'codeblock' || lowerKey === 'codespan') {
					try {
						const normalized = JSON.parse(JSON.stringify(props.code ?? ''));
						props = { ...props, code: decode(String(normalized)) };
					} catch {
						console.warn(
							`Failed to decode code prop for component "${lowerKey}". Using original value.`
						);
						props.code = decode(JSON.parse(`"${props.code}"`));
					}
				}
				const output = await renderJSX(
					result,
					jsx(value, { ...props, 'set:html': children?.value })
				);
				return __unsafeHTML(output);
			};
		}
	}
	return components;
}
