import { createMarkdownProcessor } from '@studiocms/markdown-remark-processor';
import { createComponentProxy, transformHTML } from '../runtime/AstroComponentProxy.js';
// import { TransformToProcessor } from '../schemas/index.js';
import { importComponentsKeys } from './runtime.js';
import { shared } from './shared.js';

// const studiocmsMarkdownExtended = TransformToProcessor.parse({ studiocms: shared.studiocms });

const cachedProcessor = await createMarkdownProcessor({
	...shared.markdownConfig,
	// ...studiocmsMarkdownExtended,
});

const _components = await importComponentsKeys();

/**
 * Render StudioCMS Markdown content
 *
 * @param content - The StudioCMS Markdown content
 * @param SSRResult - The SSR result Used to render the custom components
 *
 * @returns The rendered HTML
 */

export async function renderStudioCMS(content: string, SSRResult: any) {
	console.log('I AM RENDERING COMPONENTS');
	const components = createComponentProxy(SSRResult, _components);
	console.log('COMPONENTS', JSON.stringify(components));

	console.log('I AM RENDERING CONTENT');
	const code = (await cachedProcessor.render(content)).code;
	console.log('I AM TRANSFORMING HTML');
	const html = await transformHTML(code, {});
	return html;
}

export default renderStudioCMS;
