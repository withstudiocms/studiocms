import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { Root } from 'mdast';
import { definitions } from 'mdast-util-definitions';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import type { StudioCMSMarkdownProcessorOptions } from '../../types.ts';

/**
 * Remark plugin to collect local and remote image paths from markdown content. This plugin traverses the markdown abstract syntax tree (AST) and identifies all image nodes, extracting their URLs. It distinguishes between local images (which are not valid URLs and do not start with a '/') and remote images (which are valid URLs). The collected image paths are then stored in the VFile's data under the `astro` property, allowing for easy access to the list of local and remote images used in the markdown content. This is particularly useful for optimizing image handling, such as preloading or generating responsive image sets.
 *
 * @param opts - The options for the image collection plugin, which can include allowed domains and remote patterns for validating remote image URLs.
 * @returns A transformer function that processes the markdown AST and collects image paths.
 */
export function remarkCollectImages(opts: StudioCMSMarkdownProcessorOptions['image']) {
	const domains = opts?.domains ?? [];
	const remotePatterns = opts?.remotePatterns ?? [];

	return (tree: Root, vfile: VFile) => {
		if (typeof vfile?.path !== 'string') return;

		const definition = definitions(tree);
		const localImagePaths = new Set<string>();
		const remoteImagePaths = new Set<string>();
		visit(tree, (node) => {
			let url: string | undefined;
			if (node.type === 'image') {
				url = decodeURI(node.url);
			} else if (node.type === 'imageReference') {
				const imageDefinition = definition(node.identifier);
				if (imageDefinition) {
					url = decodeURI(imageDefinition.url);
				}
			}

			if (!url) return;

			if (URL.canParse(url)) {
				if (isRemoteAllowed(url, { domains, remotePatterns })) {
					remoteImagePaths.add(url);
				}
			} else if (!url.startsWith('/')) {
				// If:
				// + not a valid URL
				// + AND not an absolute path
				// Then it's a local image.
				localImagePaths.add(url);
			}
		});

		vfile.data.astro ??= {};
		vfile.data.astro.localImagePaths = Array.from(localImagePaths);
		vfile.data.astro.remoteImagePaths = Array.from(remoteImagePaths);
	};
}
