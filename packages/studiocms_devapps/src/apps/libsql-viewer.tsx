import { dbEnv } from 'virtual:studiocms-devapps/config';
import { client as _client } from 'virtual:studiocms-devapps/db';
import type { Client } from '@libsql/client/web';
import { transformTursoResult } from '@outerbase/sdk-transform';
import { defineToolbarApp } from 'astro/toolbar';
import { render } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { closeOnOutsideClick } from '../utils/app-utils.js';

interface OuterbaseStudioRequest {
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

const App = () => {
	const iframeRef = useRef<HTMLIFrameElement | null>(null);

	const client: Client = useMemo(() => _client, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const contentWindow = iframeRef.current?.contentWindow;

		if (contentWindow) {
			const handler = (e: MessageEvent) => {
				const data = e.data as OuterbaseStudioRequest;
				if (data.type === 'query' && data.statement) {
					client
						.execute(data.statement)
						.then((r) => {
							contentWindow.postMessage(
								{
									type: data.type,
									id: data.id,
									data: transformTursoResult(r),
								},
								'*'
							);
						})
						.catch((err: Error) => {
							contentWindow.postMessage(
								{
									type: data.type,
									id: data.id,
									error: err.message,
								},
								'*'
							);
						});
				} else if (data.type === 'transaction' && data.statements) {
					client
						.batch(data.statements, 'write')
						.then((r) => {
							contentWindow.postMessage(
								{
									type: data.type,
									id: data.id,
									data: r.map(transformTursoResult),
								},
								'*'
							);
						})
						.catch((err: Error) => {
							contentWindow.postMessage(
								{
									type: data.type,
									id: data.id,
									error: err.message,
								},
								'*'
							);
						});
				}
			};

			window.addEventListener('message', handler);
			return () => window.removeEventListener('message', handler);
		}
	}, [iframeRef, client]);

	return (
		<iframe
			style="height: 100%; width: 100%; border: none;"
			ref={iframeRef}
			title="Outerbase Studio"
			allow="clipboard-read; clipboard-write"
			src={getIFrameSrc(dbEnv.remoteUrl)}
		/>
	);
};

export default defineToolbarApp({
	init(canvas, eventTarget) {
		const appWindow = document.createElement('astro-dev-toolbar-window');
		appWindow.style.width = '100%';
		appWindow.style.height = '100%';

		closeOnOutsideClick(eventTarget);

		render(<App />, appWindow);

		canvas.appendChild(appWindow);
	},
});
