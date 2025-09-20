import {
	experimental_AstroContainer as AstroContainer,
	type AstroContainerOptions,
	type ContainerRenderOptions,
} from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { test as baseTest } from 'vitest';
import { cleanAstroAttributes, MockAstroLocals } from '../test-utils';

/**
 * Options for testing an Astro container.
 *
 * @property containerOptions - Optional configuration options for the Astro container.
 * @property renderComponent - A function to render an Astro component by name, with optional render options (excluding 'locals').
 *   Returns a promise that resolves to the rendered HTML string.
 */
export interface ContainerTestOptions {
	containerOptions?: AstroContainerOptions;
	renderComponent: (
		component: AstroComponentFactory,
		name: string,
		opts?: Omit<ContainerRenderOptions, 'locals'>
	) => Promise<string>;
}

/**
 * Extends the base test with custom options for container-based component rendering.
 *
 * @remarks
 * This test extension provides a `renderComponent` fixture that creates an `AstroContainer`
 * and exposes a function to render Astro components to string with mocked locals.
 * The rendered output is cleaned of Astro-specific attributes for testing purposes.
 *
 * @param containerOptions - Options used to create the `AstroContainer`.
 * @param use - Callback that receives a function to render a component.
 *
 * @returns
 * The `renderComponent` fixture provides an async function that:
 * - Renders the given Astro component to a string using the container.
 * - Applies mock locals to the rendering context.
 * - Cleans Astro-specific attributes from the output.
 * - Returns the cleaned HTML string.
 *
 * @example
 * ```typescript
 * await test('render component', async ({ renderComponent }) => {
 *   const result = await renderComponent(MyComponent, 'MyComponent', { props: { title: 'Test' } });
 *   expect(result).toMatchSnapshot();
 * });
 * ```
 */
export const test = baseTest.extend<ContainerTestOptions>({
	renderComponent: async ({ containerOptions }, use) => {
		const container = await AstroContainer.create(containerOptions);
		const render = async (
			component: AstroComponentFactory,
			name: string,
			opts: Omit<ContainerRenderOptions, 'locals'> = {}
		) => {
			const raw = await container.renderToString(component, {
				...opts,
				locals: MockAstroLocals(),
			});

			return cleanAstroAttributes(raw, `/mock/path/${name}.astro`);
		};
		await use(render);
	},
});
