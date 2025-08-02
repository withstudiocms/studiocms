import type { ClbObj } from "grapesjs";
import { PARTIAL_PATH } from "./consts.js";
import { partialRequestBuilder } from "./editor-utils.js";

/**
 * Renders a preview of a component by fetching its HTML from an API endpoint and injecting it into the specified DOM element.
 *
 * @param el - The DOM element where the component preview will be rendered.
 * @param model - The model object containing the component's tag name and data for rendering.
 *
 * The function constructs a request payload using the component's key, props, and slot data,
 * sends it to the `/studiocms_api/wysiwyg_editor/partial` endpoint, and updates the DOM element
 * with the returned HTML. If the fetch fails, it displays an error message in the element.
 */
export async function renderComponentPreview({ el, model }: ClbObj) {

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
    el.innerHTML = html;
}