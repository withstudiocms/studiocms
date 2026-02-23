/** biome-ignore-all lint/suspicious/noExplicitAny: Any is the return type of the Astro component */
import type { SSRResult } from 'astro';
import { HTMLString, renderSlot } from 'astro/runtime/server/index.js';
import { createMarkdownProcessor } from '../../core/index.ts';
import { createComponentProxy, transformHTML } from '../utils.ts';
import type { ComponentSlots, MarkdownComponentAttributes, Props } from './types.ts';

export type { Props, RenderResponse } from './types.ts';

// Get the markdown processor instance using the complete markdown configuration for the integration. This processor will be used to render markdown content in the component.
const processor = await createMarkdownProcessor();

// This file is the Generic version of the <Markdown /> Astro component.
// This version does not include anything requiring the markdown-remark Astro
// integration. You can use this version of the component in any Astro project
// without needing to add the integration to your project.

// @ts-expect-error - Fun Typescript stuff that we don't need to worry about right now
export const Markdown: (props: Props) => any = Object.assign(
	function Markdown(
		result: SSRResult,
		attr: MarkdownComponentAttributes,
		{ default: slotted }: ComponentSlots
	) {
		return {
			get [Symbol.toStringTag]() {
				return 'AstroComponent';
			},
			async *[Symbol.asyncIterator]() {
				if (typeof attr.content === 'string') {
					try {
						let components: Record<string, any> = {};

						if (attr.components) {
							components = createComponentProxy(result, attr.components);
						}

						const { code } = await processor.render(attr.content);

						const html = await transformHTML(code, components);

						yield new HTMLString(html);
					} catch {
						yield renderSlot(result, slotted);
					}
				} else {
					yield renderSlot(result, slotted);
				}
			},
		};
	},
	{
		isAstroComponentFactory: true,
	}
);
