import reactRenderer from '@astrojs/react/server.js';
import Markdoc, { type RenderableTreeNode } from '@markdoc/markdoc';
import type { MarkdocRenderer } from '@studiocms/core/schemas/renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import React from 'react';
import ReactWrapper from './markdocReact-components/MarkDocReactWrapper.astro';

/**
 * MarkDoc React Components
 *
 * The React components to use for rendering the content
 *
 * @type {Object} - The React components to use for rendering the content
 */
// biome-ignore lint/complexity/noBannedTypes: This is a valid use case for `any`
export type markdocReactComponents = {} | undefined;

/**
 * MarkDoc Render for React
 *
 * @requires `@astrojs/react` - Astro React Integration
 * @param components - The React components to use for rendering the content
 * @returns The MarkDoc React Renderer for StudioCMS MarkDoc
 */
export function markDocRenderReact(components?: markdocReactComponents): MarkdocRenderer {
	return {
		name: 'react',
		renderer: async (content: RenderableTreeNode) => {
			// Create an Astro container
			const container = await AstroContainer.create();

			// Add the Astro React server renderer
			container.addServerRenderer({
				name: '@astrojs/react',
				renderer: reactRenderer,
			});

			// Add the Astro React client renderer
			container.addClientRenderer({
				name: '@astrojs/react',
				entrypoint: '@astrojs/react/client.js',
			});

			// Return the rendered content
			return await container.renderToString(ReactWrapper, {
				props: {
					content: Markdoc.renderers.react(content, React, {
						components,
					}),
				},
			});
		},
	};
}

export default markDocRenderReact;
