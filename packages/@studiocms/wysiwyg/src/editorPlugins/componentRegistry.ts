import type { Plugin } from "grapesjs";
import type { ComponentRegistryEntry } from "studiocms/componentRegistry/types";
import { getSlotData, getTraitData, traitTypeFilter } from "../common/editor-utils.js";
import { firstUpperCase } from "../common/utils.js";

const AstroSVG: string =
	'<svg xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px" viewBox="0 0 24 24"><path fill="currentColor" d="M9.24 19.035c-.901-.826-1.164-2.561-.789-3.819c.65.793 1.552 1.044 2.486 1.186c1.44.218 2.856.137 4.195-.524c.153-.076.295-.177.462-.278c.126.365.159.734.115 1.11c-.107.915-.56 1.622-1.283 2.158c-.289.215-.594.406-.892.608c-.916.622-1.164 1.35-.82 2.41l.034.114a2.4 2.4 0 0 1-1.07-.918a2.6 2.6 0 0 1-.412-1.401c-.003-.248-.003-.497-.036-.74c-.081-.595-.36-.86-.883-.876a1.034 1.034 0 0 0-1.075.843q-.013.058-.033.126M4.1 15.007s2.666-1.303 5.34-1.303l2.016-6.26c.075-.304.296-.51.544-.51c.25 0 .47.206.545.51l2.016 6.26c3.167 0 5.34 1.303 5.34 1.303L15.363 2.602c-.13-.366-.35-.602-.645-.602H9.283c-.296 0-.506.236-.645.602c-.01.024-4.538 12.405-4.538 12.405"/></svg>';

export const astroComponents: Plugin<{ componentRegistry: ComponentRegistryEntry[] }> = (
	editor,
	opts = { componentRegistry: [] }
) => {
	const componentRegistry = opts.componentRegistry;

	const componentKeys = componentRegistry.map(({ name }) => name);

	// Add custom components from the registry
	for (const component of componentRegistry) {
		const { name, props } = component;

		// convert props to a format compatible with grapesjs
		// grapesJS expects a key pair object such as { key: value, key1: value1 }
		const traits = props.map((prop) => ({
			type: traitTypeFilter(prop.type),
			name: prop.name,
			default: `${prop.defaultValue}`,
		}));

		editor.DomComponents.addType(name, {
			isComponent: (el) => componentKeys.includes(el.tagName?.toLowerCase()),
			model: {
				defaults: {
					tagName: name,
					traits,
				},
			},
			view: {
				tagName: () => 'div',
				onRender: async ({ el, model }) => {
					const jsonBody = {
						componentKey: model.tagName,
						props: getTraitData(model),
						slot: getSlotData(model),
					};

					// Fetch from API endpoint that uses Astro Container API to render Component to html
					const getCompResponse = await fetch('/studiocms_api/wysiwyg_editor/partial', {
						method: 'POST',
						body: JSON.stringify(jsonBody),
						headers: {
							'Content-Type': 'application/json',
						},
					});

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
					el.innerHTML = html;
				},
			},
		});

		editor.BlockManager.add(name, {
			id: name,
			label: `${firstUpperCase(name)}`,
			category: 'Astro Components',
			media: AstroSVG,
			attributes: { class: 'gjs-fonts gjs-f-b1' },
			content: {
				type: `${name}`,
				tagName: name,
			},
		});
	}
};
