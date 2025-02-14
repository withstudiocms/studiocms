import { dbEnv } from 'virtual:studiocms-devapps/config';
import { createClient } from '@libsql/client/web';
import { transformTursoResult } from '@outerbase/sdk-transform';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick } from '../utils/app-utils.js';

// Define types for incoming messages
interface ClientRequest {
	type: 'query' | 'transaction';
	id: number;
	statement?: string;
	statements?: string[];
}

const sqlLiteUrl = 'https://studio.outerbase.com/embed/sqlite?theme=dark';
const tursoURL = 'https://studio.outerbase.com/embed/turso?theme=dark';

export function getIFrameSrc(dbUrl: string) {
	if (dbUrl.includes('turso.io')) {
		return tursoURL;
	}
	return sqlLiteUrl;
}

export default defineToolbarApp({
	init(canvas, eventTarget) {
		const appWindow = document.createElement('astro-dev-toolbar-window');
		appWindow.style.width = '95%';
		appWindow.style.height = '95%';

		closeOnOutsideClick(eventTarget);

		const viewerIframe = document.createElement('iframe');
		viewerIframe.src = getIFrameSrc(dbEnv.remoteUrl);
		viewerIframe.id = 'sqlIframe';
		viewerIframe.title = 'libSQL Database Viewer';
		Object.assign(viewerIframe.dataset, {
			url: dbEnv.remoteUrl,
			authtoken: dbEnv.token,
		});
		Object.assign(viewerIframe.style, {
			height: '100%',
			width: '100%',
			border: '1px solid rgba(27, 30, 36, 1)',
		} satisfies Partial<typeof viewerIframe.style>);

		appWindow.appendChild(viewerIframe);

		const client = createClient({
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			url: viewerIframe.dataset.url!,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			authToken: viewerIframe.dataset.authtoken!,
		});

		// Event listener to handle postMessage events
		window.addEventListener('message', async (e: MessageEvent<ClientRequest>) => {
			const contentWindow = viewerIframe.contentWindow;

			if (contentWindow && e.data) {
				const { type, id, statement, statements } = e.data;

				if (type === 'query' && statement) {
					// Execute a single SQL query
					try {
						const result = await client.execute(statement);
						contentWindow.postMessage(
							{
								type,
								id,
								data: transformTursoResult(result),
							},
							'*'
						);
					} catch (err) {
						contentWindow.postMessage(
							{
								type,
								id,
								error: (err as Error).message,
							},
							'*'
						);
					}
				} else if (type === 'transaction' && statements) {
					// Execute a batch of SQL statements in a transaction
					try {
						const result = await client.batch(statements, 'write');
						contentWindow.postMessage(
							{
								type,
								id,
								data: result.map(transformTursoResult),
							},
							'*'
						);
					} catch (err) {
						contentWindow.postMessage(
							{
								type,
								id,
								error: (err as Error).message,
							},
							'*'
						);
					}
				}
			}
		});

		canvas.appendChild(appWindow);
	},
});
