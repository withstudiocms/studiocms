import { createComponentProxy, transformHTML } from 'studiocms:component-proxy';
import { TransformToProcessor } from '@studiocms/core/schemas';
import { createMarkdownProcessor } from '@studiocms/markdown-remark-processor';
import { importComponentsKeys } from './runtime.js';
import { shared } from './shared.js';

const studiocmsMarkdownExtended = TransformToProcessor.parse(shared.studiocms);

const cachedProcessor = await createMarkdownProcessor({
	...shared.markdownConfig,
	...studiocmsMarkdownExtended,
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function renderStudioCMS(content: string, SSRResult: any) {
	const components = createComponentProxy(SSRResult, _components);
	const code = (await cachedProcessor.render(content)).code;

	const html = await transformHTML(code, components, studiocmsMarkdownExtended.studiocms.sanitize);
	return html;
}

export default renderStudioCMS;
