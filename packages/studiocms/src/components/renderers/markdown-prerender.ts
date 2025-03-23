import rendererConfig from 'studiocms:renderer/config';
import { createMarkdownProcessor as createAstroMD } from '@astrojs/markdown-remark';
import {
	type StudioCMSConfigOptions,
	createMarkdownProcessor as createStudioCMSMD,
} from '@studiocms/markdown-remark-processor';
import { shared } from '../../lib/renderer/shared.js';

// Initialize markdown processor (Astro)
const astroMD = await createAstroMD(shared.markdownConfig);

// Initialize markdown processor (StudioCMS)
const studioCMSMD = await createStudioCMSMD({
	...shared.markdownConfig,
	studiocms: shared.studiocms ? (shared.studiocms as StudioCMSConfigOptions) : undefined,
});

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
