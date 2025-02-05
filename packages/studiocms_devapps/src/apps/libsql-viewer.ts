import { libSQLEndpoint } from 'virtual:studiocms-devapps/endpoints';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick } from '../utils/app-utils.js';

export default defineToolbarApp({
	init(canvas, eventTarget) {
		const appWindow = document.createElement('astro-dev-toolbar-window');
		appWindow.style.width = '95%';
		appWindow.style.height = '80vh';

		closeOnOutsideClick(eventTarget);

		const link = document.createElement('a');
		link.href = libSQLEndpoint;
		link.target = '_blank';
		link.innerText = 'Open as page';
		Object.assign(link.style, {
			display: 'inline-block',
			marginRight: 'auto',
			color: 'rgba(224, 204, 250, 1)',
			marginBottom: '16px',
			textDecoration: 'none',
			border: '1px solid rgba(224, 204, 250, 1)',
			padding: '8px 16px',
			borderRadius: '4px',
		} satisfies Partial<typeof link.style>);
		appWindow.appendChild(link);

		const viewerIframe = document.createElement('iframe');
		viewerIframe.src = libSQLEndpoint;
		Object.assign(viewerIframe.style, {
			height: '100%',
			width: '100%',
			border: '1px solid rgba(27, 30, 36, 1)',
		} satisfies Partial<typeof viewerIframe.style>);

		appWindow.appendChild(viewerIframe);

		canvas.appendChild(appWindow);
	},
});
