import rendererConfig from 'studiocms:renderer/config';
import { createMarkdownProcessor as createAstroMD } from '@astrojs/markdown-remark';
import {
	type StudioCMSConfigOptions,
	createMarkdownProcessor as createStudioCMSMD,
} from '@studiocms/markdown-remark-processor';
import { shared } from '../../lib/renderer/shared.js';

// Initialize markdown processor (Astro)
const astroMD = await createAstroMD(shared.astroMDRemark);

// Initialize markdown processor (StudioCMS)
const studioCMSMD = await createStudioCMSMD({
	...shared.astroMDRemark,
	studiocms: shared.studiocmsMarkdown
		? (shared.studiocmsMarkdown as StudioCMSConfigOptions)
		: undefined,
});

/**
 * Creates a pre-render function for processing markdown content based on the configured renderer flavor.
 *
 * @returns A function that takes a markdown content string and returns a Promise resolving to the rendered string.
 *
 * The pre-render function dynamically selects the markdown processor to use:
 * - If the `rendererConfig.flavor` is set to `'astro'`, it uses the `astroMD.render` method.
 * - Otherwise, it defaults to using the `studioCMSMD.render` method.
 */
export function preRender(): (content: string) => Promise<string> {
	// Define pre-render function
	let render: (content: string) => Promise<string>;

	// Determine which markdown processor to use (default to StudioCMS)
	switch (rendererConfig.flavor) {
		case 'astro':
			render = async (content: string) => {
				return (await astroMD.render(content)).code;
			};
			break;
		default:
			render = async (content: string) => {
				return (await studioCMSMD.render(content)).code;
			};
			break;
	}

	return render;
}
