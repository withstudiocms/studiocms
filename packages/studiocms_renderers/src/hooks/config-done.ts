import { defineUtility } from 'astro-integration-kit';
import { rendererDTS } from '../stubs/renderer';
import { rendererConfigDTS } from '../stubs/renderer-config';
import { rendererAstroMarkdownDTS } from '../stubs/renderer-markdownConfig';

export const configDone = defineUtility('astro:config:done')(
	({ injectTypes }, RendererComponent: string) => {
		// Inject Types for Renderer
		injectTypes(rendererDTS(RendererComponent));

		// Inject Types for Renderer Config
		injectTypes(rendererConfigDTS());

		// Inject Types for Astro Markdown Config
		injectTypes(rendererAstroMarkdownDTS());
	}
);

export default configDone;
