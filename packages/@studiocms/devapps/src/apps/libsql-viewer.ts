import { libsqlEndpoint } from 'virtual:studiocms-devapps/endpoints';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick } from '../utils/app-utils.js';

export default defineToolbarApp({
	init(canvas, eventTarget) {
		const appWindow = document.createElement('astro-dev-toolbar-window');
		appWindow.style.width = '90%';
		appWindow.style.height = '100%';
		appWindow.style.marginLeft = '1rem';
		appWindow.style.marginRight = '1rem';
		appWindow.style.padding = '0';
		appWindow.style.border = 'none';
		appWindow.style.overflow = 'hidden';
		appWindow.style.borderRadius = '0.5rem';
		appWindow.style.boxShadow = '0 0 1rem rgba(0, 0, 0, 0.1)';

		closeOnOutsideClick(eventTarget);

		const viewerIframe = document.createElement('iframe');
		viewerIframe.src = libsqlEndpoint;
		viewerIframe.id = 'sqlIframe';
		viewerIframe.title = 'libSQL Database Viewer';
		Object.assign(viewerIframe.style, {
			height: '100%',
			width: '100%',
			border: '1px solid rgba(27, 30, 36, 1)',
		});
		appWindow.appendChild(viewerIframe);

		canvas.appendChild(appWindow);
	},
});
