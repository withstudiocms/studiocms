import fs from 'node:fs';
import * as td from 'typedoc';

/** @param {td.Application} app */
export function load(app) {
	const pagesToRemove = [];
	// Add event listeners to app, app.converter, etc.
	// this function may be async
	app.renderer.on(td.PageEvent.END, (event) => {
		if (event.url === 'README.md') {
			pagesToRemove.push(event.filename);
		}
	});
	app.renderer.on(td.RendererEvent.END, () => {
		onRendererEnd(pagesToRemove);
	});
}

function onRendererEnd(pagesToRemove) {
	for (const page of pagesToRemove) {
		fs.rmSync(page, { force: true });
	}
}
