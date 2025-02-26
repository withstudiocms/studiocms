import { dbEnv } from 'virtual:studiocms-devapps/config';
import { createClient } from '@libsql/client/web';
import { transformTursoResult } from '@outerbase/sdk-transform';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick } from '../utils/app-utils.js';

/**
 * Represents a client request to the server.
 *
 * @interface ClientRequest
 *
 * @property {'query' | 'transaction'} type - The type of the request, which can be either 'query' or 'transaction'.
 * @property {number} id - A unique identifier for the request.
 * @property {string} [statement] - An optional SQL statement to be executed. This is used when the type is 'query'.
 * @property {string[]} [statements] - An optional array of SQL statements to be executed. This is used when the type is 'transaction'.
 */
interface ClientRequest {
	type: 'query' | 'transaction';
	id: number;
	statement?: string;
	statements?: string[];
}

const sqlLiteUrl = 'https://studio.outerbase.com/embed/sqlite?theme=dark';
const tursoURL = 'https://studio.outerbase.com/embed/turso?theme=dark';

/**
 * Generates the source URL for an iframe based on the provided database URL.
 *
 * @param dbUrl - The URL of the database.
 * @returns The source URL for the iframe. If the database URL contains 'turso.io',
 *          it returns `tursoURL`. Otherwise, it returns `sqlLiteUrl`.
 */
export function getIFrameSrc(dbUrl: string) {
	if (dbUrl.includes('turso.io')) {
		return tursoURL;
	}
	return sqlLiteUrl;
}

/**
 * Defines a toolbar application for viewing and interacting with a libSQL database.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element where the app will be initialized.
 * @param {EventTarget} eventTarget - The event target for handling outside click events.
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * import libsqlViewer from './libsql-viewer';
 *
 * const canvas = document.getElementById('appCanvas') as HTMLCanvasElement;
 * const eventTarget = new EventTarget();
 *
 * libsqlViewer.init(canvas, eventTarget);
 * ```
 *
 * @remarks
 * This function creates an iframe to display the libSQL database viewer and sets up
 * event listeners to handle SQL query and transaction requests via postMessage.
 *
 * The iframe's source URL and authentication token are retrieved from the `dbEnv` object.
 *
 * The `createClient` function is used to create a client for executing SQL queries and transactions.
 *
 * The `closeOnOutsideClick` function is used to close the app window when a click is detected outside of it.
 *
 * The `transformTursoResult` function is used to transform the results of SQL queries and transactions.
 *
 * The `biome-ignore` comments are used to suppress linting warnings for non-null assertions.
 *
 * @see {@link createClient}
 * @see {@link closeOnOutsideClick}
 * @see {@link transformTursoResult}
 */
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
