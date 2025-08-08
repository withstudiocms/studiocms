import type { BlockProperties, Component, Editor, ProjectData, TraitProperties } from 'grapesjs';
import type { AstroComponentProp, ComponentRegistryEntry } from 'studiocms/componentRegistry/types';
import { STORE_ENDPOINT_PATH } from '../consts.js';
import { firstUpperCase, parse } from '../utils.js';

/**
 * Generates an HTML string representation of the main component within the editor,
 * including its styles. The styles are adjusted to replace all occurrences of 'body'
 * with 'div' to ensure proper scoping.
 *
 * @param editor - The editor instance from which to extract the main page and component.
 * @returns A promise that resolves to a string containing the HTML and scoped styles.
 */
export const generateHTML = async (editor: Editor): Promise<string> => {
	const page = editor.Pages.getMain();
	const component = page.getMainComponent();
	const htmlData = component.toHTML({ tag: 'div' });
	const styles = editor.getCss({ component })?.replaceAll('body', 'div');
	const html = `${htmlData}${styles ? `<style>${styles}</style>` : ''}`;
	return html;
};

/**
 * Registers a custom storage adapter named 'db' for the provided editor instance.
 * This adapter enables loading and storing project data to a backend database using fetch requests.
 *
 * @param editor - The editor instance to which the storage adapter will be added.
 * @param opts - Configuration options for the storage adapter.
 * @param opts.projectId - The unique identifier for the project whose data is being managed.
 * @param opts.projectData - The initial project data to use as a fallback if loading fails.
 * @param opts.pageContent - The HTML element where the serialized project data and generated HTML will be stored.
 *
 * The storage adapter provides two asynchronous methods:
 * - `load`: Fetches project data from the backend using the projectId. Returns the fetched data or the fallback projectData if the request fails.
 * - `store`: Sends the updated project data to the backend and updates the pageContent element with the serialized data and generated HTML.
 */
export const StudioCMSDbStorageAdapter = (
	editor: Editor,
	opts: { projectId: string; projectData: ProjectData; pageContent: HTMLElement }
) => {
	editor.Storage.add('db', {
		async load() {
			// Load data from the database using the projectId
			const data = await fetch(STORE_ENDPOINT_PATH, {
				method: 'GET',
				body: JSON.stringify({ projectId: opts.projectId }),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			// Check if the response is ok, if not return the fallback projectData
			// This ensures that if the request fails, we still have a valid projectData 
			// to work with and prevents the editor from crashing due to missing data.
			if (!data.ok) {
				return opts.projectData;
			}

			// Parse the response data as JSON and return it
			const responseData: ProjectData = await data.json();
			return responseData;
		},
		async store(data) {
			// Store data in the database using the projectId
			const response = await fetch(STORE_ENDPOINT_PATH, {
				method: 'POST',
				body: JSON.stringify({ projectId: opts.projectId, data }),
				headers: {
					'Content-Type': 'application/json',
				},
			});

			// Check if the response is ok, if not throw an error
			if (!response.ok) {
				throw new Error(`Failed to store data for project ${opts.projectId}`);
			}

			// Update the page content with the serialized data
			opts.pageContent.innerText = JSON.stringify({
				...data,
				__STUDIOCMS_HTML: await generateHTML(editor),
			});
		},
	});
};

/**
 * Reduces an array of `TraitProperties` into an accumulator object, mapping trait names to their values.
 *
 * - If the trait type is `'number'`, the value is coerced to a number.
 * - If the trait value is an empty string, the default value is used.
 * - Traits without a name are skipped.
 *
 * @param acc - The accumulator object that collects trait name-value pairs.
 * @param trait - The trait to process and add to the accumulator.
 * @returns The updated accumulator with the trait's name and resolved value.
 */

// biome-ignore lint/suspicious/noExplicitAny: this is the expected type for the accumulator
export function traitReducer(acc: Record<string, any>, trait: TraitProperties) {
	if (!trait.name) return acc;

	let value: string | number = trait.default;

	if (trait.type === 'number') {
		value = Number(trait.value !== '' ? trait.value : trait.default);
	} else {
		value = trait.value !== '' ? trait.value : trait.default;
	}

	acc[trait.name] = value;
	return acc;
}

/**
 * Extracts and aggregates trait properties from a given component model.
 *
 * @param model - The component model containing traits to extract.
 * @returns An object containing the aggregated trait properties.
 */
export const getTraitData = (model: Component) => {
	const traitData: TraitProperties[] = model.traits.toJSON();
	const propsData = traitData.reduce(traitReducer, {});
	return propsData;
};

/**
 * Generates an HTML string representing the slot data for a given component model.
 *
 * Iterates through the child components of the provided model, converts each child to HTML,
 * and wraps it with its respective tag name. The resulting HTML strings are concatenated
 * and returned as a single string.
 *
 * @param model - The component model whose children will be processed.
 * @returns A string containing the HTML representation of the model's child components,
 *          or an empty string if there are no children.
 */
export const getSlotData = (model: Component) => {
	const children = model.components().toArray();
	let slotData = '';

	if (children.length > 0) {
		slotData = children.map((child) => child.toHTML()).join('');
	}

	return slotData;
};

/**
 * Returns the appropriate input type for a given trait type.
 *
 * @param type - The trait type to filter (e.g., "number", "string", etc.).
 * @returns The corresponding input type as a string. Returns "number" if the type is "number", otherwise returns "text".
 */
export const traitTypeFilter = (type: string) => {
	switch (type) {
		case 'number':
			return 'number';
		default:
			return 'text';
	}
};

/**
 * Maps an `AstroComponentProp` to a new object with filtered type, name, and default value.
 *
 * @param prop - The Astro component property to map.
 * @returns An object containing:
 *  - `type`: The filtered type of the property.
 *  - `name`: The name of the property.
 *  - `default`: The default value of the property.
 */
export const traitMapFn = (prop: AstroComponentProp) => ({
	type: traitTypeFilter(prop.type),
	name: prop.name,
	default: prop.defaultValue,
});

/**
 * Builds a partial request configuration for a given component model.
 *
 * @param model - The component model to build the request from.
 * @returns A `RequestInit` object configured for a POST request with the component's data as JSON.
 */
export const partialRequestBuilder = (model: Component): RequestInit => {
	return {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			componentKey: model.tagName,
			props: getTraitData(model),
			slot: getSlotData(model),
		}),
	};
};

/**
 * Retrieves and parses essential editor elements and data from the DOM.
 *
 * @param document - The `Document` object to query for elements.
 * @param selectors - An object containing CSS selectors for the container and page content elements.
 * @param selectors.container - CSS selector for the GrapesJS container element.
 * @param selectors.pageContent - CSS selector for the page content textarea element.
 * @returns An object containing:
 *   - `astroComponentsOpts`: Options including the parsed component registry.
 *   - `inlineStorageOpts`: Options including the page content element and parsed project data.
 * @throws Will throw an error if the container or page content elements are not found in the DOM.
 */
export function getEditorElmData(
	document: Document,
	selectors: {
		container: string;
		pageContent: string;
	}
) {
	// Resolve the GrapesJS container element from the document
	const container = document.querySelector<HTMLDivElement>(selectors.container) as HTMLDivElement;

	// If the container is not found, throw an error
	if (!container) {
		throw new Error('GrapesJS container not found. Ensure the HTML structure is correct.');
	}

	// Resolve the page content textarea element from the document
	const pageContent = document.querySelector<HTMLTextAreaElement>(
		selectors.pageContent
	) as HTMLTextAreaElement;

	// If the page content element is not found, throw an error
	if (!pageContent) {
		throw new Error('Page content textarea not found. Ensure the HTML structure is correct.');
	}

	// Parse the component registry from the container's dataset
	// or use an empty object if not available
	const componentRegistry = parse<ComponentRegistryEntry[]>(
		container.dataset.componentRegistry || '[]'
	);

	const projectId = container.dataset.pageId || '';

	// Provide fallback data for project pages if the page content is empty
	// This ensures that the inline storage options are always populated
	// with valid data, preventing potential errors in the editor.
	const fallbackPages = {
		pages: [{ name: 'page' }],
	};

	// Parse the project data from the page content's inner text
	const projectData = parse<ProjectData>(pageContent.innerText || JSON.stringify(fallbackPages));

	// Return the options for Astro components and inline storage
	return {
		astroComponentsOpts: { componentRegistry },
		inlineStorageOpts: {
			pageContent,
			projectData,
		},
		StudioCMSDbStorageAdapterOpts: {
			projectId,
			projectData,
			pageContent,
		},
	};
}

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
