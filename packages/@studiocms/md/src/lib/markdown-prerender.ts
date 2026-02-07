import rendererConfig from 'studiocms:md/config';
import { createMarkdownProcessor as createAstroMD } from '@astrojs/markdown-remark';
import {
	createMarkdownProcessor as createStudioCMSMD,
	type StudioCMSMarkdownProcessorOptions,
} from '@studiocms/markdown-remark-processor';
import { shared } from './shared.js';

export function parseCallouts(opt: false | 'obsidian' | 'github' | 'vitepress' | undefined) {
	if (opt === false) return false;
	if (!opt) return undefined;
	return {
		theme: opt,
	};
}

const parseStudioCMSMDOpts = (): StudioCMSMarkdownProcessorOptions['studiocms'] => {
	/* v8 ignore start */
	if (shared.mdConfig?.flavor === 'studiocms') {
		return {
			autolink: shared.mdConfig?.autoLinkHeadings,
			discordSubtext: shared.mdConfig?.discordSubtext,
			callouts: parseCallouts(shared.mdConfig?.callouts),
		};
	}
	/* v8 ignore stop */

	return {
		autolink: false,
		discordSubtext: false,
		callouts: undefined,
	};
};

let astroMDPromise: Promise<Awaited<ReturnType<typeof createAstroMD>>> | undefined;
let studioCMSMDPromise: Promise<Awaited<ReturnType<typeof createStudioCMSMD>>> | undefined;

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
	return async (content: string) => {
		if (rendererConfig.flavor === 'astro') {
			if (!astroMDPromise) astroMDPromise = createAstroMD(shared.astroMDRemark);
			const astroMD = await astroMDPromise;
			return (await astroMD.render(content)).code;
		}
		if (!studioCMSMDPromise) {
			// Recompute options at first use to reflect shared state
			studioCMSMDPromise = createStudioCMSMD({
				...(shared.astroMDRemark ?? {}),
				studiocms: parseStudioCMSMDOpts(),
			});
		}
		const studioCMSMD = await studioCMSMDPromise;
		return (await studioCMSMD.render(content)).code;
	};
}
