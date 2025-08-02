import type { BlockProperties } from 'grapesjs';
import { firstUpperCase } from './utils.js';

/**
 * Common properties for a block component used in the WYSIWYG editor.
 *
 * @remarks
 * This object provides default values for block properties such as category, selection and activation state,
 * HTML attributes, and a media SVG icon. It is intended to be used as a base configuration for Astro Components
 * within the editor.
 *
 * @typeParam BlockProperties - The type describing the properties of a block.
 *
 * @property category - The category under which the block is grouped (e.g., 'Astro Components').
 * @property select - Indicates if the block can be selected.
 * @property activate - Indicates if the block can be activated.
 * @property attributes - HTML attributes to be applied to the block's root element.
 * @property media - SVG markup representing the block's icon in the editor.
 */
const commonBlockProps: Partial<BlockProperties> = {
	category: 'Astro Components',
	select: true,
	activate: true,
	attributes: { class: 'gjs-fonts gjs-f-b1' },
	media:
		'<svg xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px" viewBox="0 0 24 24"><path fill="currentColor" d="M9.24 19.035c-.901-.826-1.164-2.561-.789-3.819c.65.793 1.552 1.044 2.486 1.186c1.44.218 2.856.137 4.195-.524c.153-.076.295-.177.462-.278c.126.365.159.734.115 1.11c-.107.915-.56 1.622-1.283 2.158c-.289.215-.594.406-.892.608c-.916.622-1.164 1.35-.82 2.41l.034.114a2.4 2.4 0 0 1-1.07-.918a2.6 2.6 0 0 1-.412-1.401c-.003-.248-.003-.497-.036-.74c-.081-.595-.36-.86-.883-.876a1.034 1.034 0 0 0-1.075.843q-.013.058-.033.126M4.1 15.007s2.666-1.303 5.34-1.303l2.016-6.26c.075-.304.296-.51.544-.51c.25 0 .47.206.545.51l2.016 6.26c3.167 0 5.34 1.303 5.34 1.303L15.363 2.602c-.13-.366-.35-.602-.645-.602H9.283c-.296 0-.506.236-.645.602c-.01.024-4.538 12.405-4.538 12.405"/></svg>',
};

/**
 * Builds and returns the block properties object for a given block name.
 *
 * For the special case of 'cms-img', it returns a block configuration with
 * specific content type and style. For all other names, it returns a generic
 * block configuration using the provided name as the type and tagName.
 *
 * @param name - The name of the block to build properties for.
 * @returns The block properties object configured for the specified block name.
 */
export function buildBlockProps(name: string) {
	switch (name) {
		case 'cms-img': {
			// Special handling for 'cms-img' component
			return {
				...commonBlockProps,
				id: name,
				label: `${firstUpperCase(name)}`,
				content: {
					style: { color: 'black' },
					type: 'image',
				},
			};
		}
		default: {
			return {
				...commonBlockProps,
				id: name,
				label: `${firstUpperCase(name)}`,
				content: {
					type: name,
					tagName: name,
				},
			};
		}
	}
}
