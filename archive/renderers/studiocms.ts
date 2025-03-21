import {
	type StudioCMSConfigOptions,
	createMarkdownProcessor,
} from '@studiocms/markdown-remark-processor';
import type { SSRResult } from 'astro';
import { createComponentProxy, transformHTML } from '../../runtime/AstroComponentProxy.js';
import { importComponentsKeys } from './runtime.js';
import { shared } from './shared.js';

const cachedProcessor = await createMarkdownProcessor({
	...shared.markdownConfig,
	studiocms: shared.studiocms ? (shared.studiocms as StudioCMSConfigOptions) : undefined,
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

export async function renderStudioCMS(content: string, SSRResult: SSRResult) {
	const components = createComponentProxy(SSRResult, _components);
	const code = (await cachedProcessor.render(content)).code;
	const html = await transformHTML(code, components);
	return html;
}

export default renderStudioCMS;
