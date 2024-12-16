import { defineUtility } from 'astro-integration-kit';
import rendererDTS from '../stubs/renderer';
import rendererConfigDTS from '../stubs/renderer-config';
import rendererMarkdownConfigDTS from '../stubs/renderer-markdownConfig';

export const configDone = defineUtility('astro:config:done')(({ injectTypes }) => {
	// Inject Types for Renderer
	injectTypes(rendererDTS);

	// Inject Types for Renderer Config
	injectTypes(rendererConfigDTS);

	// Inject Types for Astro Markdown Config
	injectTypes(rendererMarkdownConfigDTS);
});

export default configDone;
