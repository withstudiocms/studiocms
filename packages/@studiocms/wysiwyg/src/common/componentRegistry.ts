import type { Plugin } from 'grapesjs';
import type { ComponentRegistryEntry } from 'studiocms/componentRegistry/types';
import { buildBlockProps } from './build-block-props.js';
import { renderComponentPreview } from './component-preview.js';
import { traitMapFn } from './editor-utils.js';

/**
 * Represents a collection of registered components for use within the Astro environment.
 *
 * @property componentRegistry - An array of `ComponentRegistryEntry` objects, each describing a registered component.
 */
interface AstroComponents {
	componentRegistry: ComponentRegistryEntry[];
}

/**
 * Registers custom Astro components in the GrapesJS editor using a provided component registry.
 *
 * This plugin iterates over the given `componentRegistry` array and for each entry:
 * - Adds a new component type to the GrapesJS `DomComponents` manager, mapping the component's props to GrapesJS traits.
 * - Registers a new block in the GrapesJS `BlockManager` for easy drag-and-drop usage in the editor.
 *
 * @param editor - The GrapesJS editor instance to extend.
 * @param opts - Optional configuration object.
 * @param opts.componentRegistry - An array of component registry entries, each describing an Astro component to register.
 *
 * Each component registry entry should have:
 * - `name`: The tag name of the component.
 * - `props`: An array of prop definitions, each with `name`, `type`, and `defaultValue`.
 *
 * @remarks
 * - The function expects helper functions such as `traitTypeFilter`, `renderComponentPreview`, `firstUpperCase`, and the `AstroSVG` asset to be available in scope.
 * - The registered components and blocks will appear under the "Astro Components" category in the GrapesJS block manager.
 */
export const astroComponents: Plugin<AstroComponents> = (editor, { componentRegistry }) => {
	// Get the keys of the component registry for quick lookup
	const componentKeys = componentRegistry.map(({ name }) => name);

	// Add custom components from the registry
	for (const component of componentRegistry) {
		const { name: tagName, props } = component;

		// Add the component type to the GrapesJS DomComponents manager
		editor.DomComponents.addType(tagName, {
			isComponent: (el) => componentKeys.includes(el.tagName?.toLowerCase()),
			model: {
				defaults: {
					tagName,
					traits: props.map(traitMapFn),
				},
			},
			view: {
				tagName: () => 'div',
				onRender: renderComponentPreview,
			},
		});

		// Register a block for the component in the GrapesJS BlockManager
		// This allows users to drag and drop the component into the editor
		editor.BlockManager.add(tagName, buildBlockProps(tagName));
	}
};
