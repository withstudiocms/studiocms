import rendererConfig from 'studiocms:md/config';
import { createMarkdownProcessor as createAstroMD } from '@astrojs/markdown-remark';
import {
	type StudioCMSMarkdownProcessorOptions,
	createMarkdownProcessor as createStudioCMSMD,
} from '@studiocms/markdown-remark-processor';
import { shared } from './shared.js';

function parseCallouts(opt: false | 'obsidian' | 'github' | 'vitepress' | undefined) {
	if (opt === false) return false;
	if (!opt) return undefined;
	return {
		theme: opt,
	};
}

const parseStudioCMSMDOpts = (): StudioCMSMarkdownProcessorOptions['studiocms'] => {
	if (shared.mdConfig?.flavor === 'studiocms') {
		return {
			autolink: shared.mdConfig?.autoLinkHeadings,
			discordSubtext: shared.mdConfig?.discordSubtext,
			callouts: parseCallouts(shared.mdConfig?.callouts),
		}
	}

	return {
		autolink: false,
		discordSubtext: false,
		callouts: undefined,
	}
}

const createStudioCMSMDOpts: StudioCMSMarkdownProcessorOptions = {
	...shared.astroMDRemark,
	studiocms: parseStudioCMSMDOpts(),
};

const [astroMD, studioCMSMD] = await Promise.all([
	// Initialize markdown processor (Astro)
	createAstroMD(shared.astroMDRemark),
	// Initialize markdown processor (StudioCMS)
	createStudioCMSMD(createStudioCMSMDOpts),
]);

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
