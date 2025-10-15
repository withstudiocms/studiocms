import { createRenderer } from 'studiocms:component-registry/runtime';
import { createComponentProxy, transformHTML } from '@withstudiocms/component-registry';
import type { SSRResult } from 'astro';
import type { SanitizeOptions } from 'ultrahtml/transformers/sanitize';

// biome-ignore lint/suspicious/noExplicitAny: Astro components do not have a properly exported type
type AstroComponent = (props: any) => any;

interface PrefixRenderAugment {
	type: 'prefix';
	components: Record<string, AstroComponent>;
	html: string;
}

interface SuffixRenderAugment {
	type: 'suffix';
	components: Record<string, AstroComponent>;
	html: string;
}

interface ComponentRenderAugment {
	type: 'component';
	components: Record<string, AstroComponent>;
}

export type RenderAugment = PrefixRenderAugment | SuffixRenderAugment | ComponentRenderAugment;

const handlePrefixSuffix = (type: 'prefix' | 'suffix', html: string, content: string) =>
	type === 'prefix' ? html + content : content + html;

export const renderFn = async (args: {
	renderOpts: {
		result: SSRResult;
		sanitizeOpts?: SanitizeOptions;
		preRenderer?: (content: string) => Promise<string>;
	};
	augments?: RenderAugment[];
	content: string;
}) => {
	// Destructure arguments for easier access
	const { renderOpts, augments = [], content } = args;
	const { result, sanitizeOpts, preRenderer } = renderOpts;

	// Create the initial renderer
	const render = await createRenderer(result, sanitizeOpts, preRenderer);

	// Render content to HTML before applying augments
	let renderedContent = await render(content);

	// Apply augments in the order they are provided
	for (const augment of augments) {
		switch (augment.type) {
			case 'suffix':
			case 'prefix':
			case 'component': {
				const { components: _components = {} } = augment;
				const components = createComponentProxy(result, _components);

				if (augment.type === 'prefix' || augment.type === 'suffix') {
					renderedContent = handlePrefixSuffix(augment.type, augment.html, renderedContent);
				}
				renderedContent = await transformHTML(renderedContent, components);
				break;
			}
		}
	}

	// Return the final rendered content
	return renderedContent;
};
