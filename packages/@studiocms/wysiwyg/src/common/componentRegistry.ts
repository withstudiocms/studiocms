import type { Plugin } from 'grapesjs';
import type { ComponentRegistryEntry } from 'studiocms/componentRegistry/types';
import { PARTIAL_PATH } from '../consts.js';
import { buildBlockProps, partialRequestBuilder, traitMapFn } from './editor-utils.js';

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

	// Setup custom code block
	let timedInterval: NodeJS.Timeout;

	// Add custom components from the registry
	for (const component of componentRegistry) {
		const { name, props } = component;

		// Add the component type to the GrapesJS DomComponents manager
		editor.DomComponents.addType(name, {
			isComponent: (el) => componentKeys.includes(el.tagName?.toLowerCase()),
			model: {
				defaults: {
					tagName: name,
					traits: props.map(traitMapFn),
				},
			},
			view: {
				tagName: () => 'div',
				init() {
					this.listenTo(this.model.components(), 'add remove reset', this.onChange);
					this.listenTo(this.model, 'change', this.onChange);
					this.onChange();
				},
				async onChange() {
					timedInterval && clearInterval(timedInterval);
					timedInterval = setTimeout(async () => {
						const { model, el } = this;
						
						// Fetch from API endpoint that uses Astro Container API to render Component to html
						const getCompResponse = await fetch(PARTIAL_PATH, partialRequestBuilder(model));

						let html = '';

						// If response is not valid, log error.
						if (!getCompResponse.ok) {
							console.log('[Error]: Could not fetch component HTML, please try again.');
							html = `<div class="error">Error: ${getCompResponse.statusText}</div>`;
							el.innerHTML = html;
							return;
						}

						// Get HTML from JSON response
						html = await getCompResponse.text();

						// Update the element's innerHTML with the new HTML
						el.innerHTML = html;
					}, 1000);
				}
			},
		});

		// Register a block for the component in the GrapesJS BlockManager
		// This allows users to drag and drop the component into the editor
		editor.BlockManager.add(name, buildBlockProps(name));
	}
};
