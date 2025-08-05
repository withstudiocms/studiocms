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

	// Add custom components from the registry
	for (const component of componentRegistry) {
		const { name, props } = component;

		// Define a timed interval to fetch component HTML
		// This will be used to update the component's preview in the editor
		// The interval is cleared and reset on each change to avoid multiple fetches
		let timedInterval: NodeJS.Timeout;
		let abortController: AbortController | null;

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
				onChange() {
					timedInterval && clearTimeout(timedInterval);
					abortController?.abort();
					timedInterval = setTimeout(
						() => {
							abortController = new AbortController();
							fetch(PARTIAL_PATH, {
								...partialRequestBuilder(this.model),
								signal: abortController.signal
							})
							.then((getCompResponse) => {
								// If response is not valid, log error.
								if (!getCompResponse.ok) {
									console.log('[Error]: Could not fetch component HTML, please try again.');
									const html = `<div class="error">Error: ${getCompResponse.statusText}</div>`;
									this.el.innerHTML = html;
									return;
								}

								// Get HTML from response and update element
								return getCompResponse.text();
							})
							.then((html) => {
								if (html !== undefined) {
									// Only update if we got HTML (not from error case)
									this.el.innerHTML = html;
								}
							})
							.catch((error) => {
								if (error.name !== 'AbortError') {
									console.log('[Error]: Network or parsing error:', error);
									this.el.innerHTML = `<div class="error">Network Error</div>`;
								}
							});
						},
						100
					);
				},
			},
		});

		// Register a block for the component in the GrapesJS BlockManager
		// This allows users to drag and drop the component into the editor
		editor.BlockManager.add(name, buildBlockProps(name));
	}
};
