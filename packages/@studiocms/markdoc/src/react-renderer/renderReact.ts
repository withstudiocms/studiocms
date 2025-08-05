import reactRenderer from '@astrojs/react/server.js';
import Markdoc from '@markdoc/markdoc';
import { experimental_AstroContainer } from 'astro/container';
import * as React from 'react';
import type { MarkDocRenderer } from '../types.js';
import ReactWrapper from './ReactWrapper.astro';

/**
 * MarkDoc React Components
 *
 * The React components to use for rendering the content
 *
 * @type {Object} - The React components to use for rendering the content
 */
// biome-ignore lint/complexity/noBannedTypes: This is a valid use case for `any`
export type markdocReactComponents = {} | undefined;

export const renderReact = (components?: markdocReactComponents): MarkDocRenderer => ({
	name: 'react',
	render: async (content) => {
		// Create an Astro Container
		const container = await experimental_AstroContainer.create();

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

		const renderedContent = await container.renderToString(ReactWrapper, {
			props: {
				content: Markdoc.renderers.react(content, React, {
					components,
				}),
			},
		});

		return renderedContent;
	},
});
