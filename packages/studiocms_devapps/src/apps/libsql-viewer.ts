import { dbEnv } from 'virtual:studiocms-devapps/config';
import { libSQLEndpoint } from 'virtual:studiocms-devapps/endpoints';
import { createClient } from '@libsql/client/web';
import { defineToolbarApp } from 'astro/toolbar';
import { closeOnOutsideClick } from '../utils/app-utils.js';

// Define types for incoming messages
interface ClientRequest {
	type: 'query' | 'transaction';
	id: number;
	statement?: string;
	statements?: string[];
}

interface ResultHeader {
	name: string;
	displayName: string;
	originalType: string | null;
	type: ColumnType;
}

interface Result {
	rows: Record<string, unknown>[];
	headers: ResultHeader[];
	stat: {
		rowsAffected: number;
		rowsRead: number | null;
		rowsWritten: number | null;
		queryDurationMs: number | null;
	};
	lastInsertRowid?: number | undefined; // Explicitly include undefined
}

enum ColumnType {
	TEXT = 1,
	INTEGER = 2,
	REAL = 3,
	BLOB = 4,
}

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
		viewerIframe.src = 'https://libsqlstudio.com/embed/sqlite?name=libSQLDatabase&theme=dark';
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

		// Function to transform raw SQL result
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		function transformRawResult(raw: any): Result {
			const headerSet = new Set<string>();

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const headers: ResultHeader[] = raw.columns.map((colName: any, colIdx: string | number) => {
				const colType = raw.columnTypes[colIdx];
				let renameColName = colName;

				for (let i = 0; i < 20; i++) {
					if (!headerSet.has(renameColName)) break;
					renameColName = `__${colName}_${i}`;
				}

				headerSet.add(renameColName);

				return {
					name: renameColName,
					displayName: colName,
					originalType: colType,
					type: convertSqliteType(colType),
				};
			});

			const rows = raw.rows.map((r: unknown[]) =>
				headers.reduce(
					(a, b, idx) => {
						a[b.name] = r[idx];
						return a;
					},
					{} as Record<string, unknown>
				)
			);

			return {
				rows,
				stat: {
					rowsAffected: raw.rowsAffected,
					rowsRead: null,
					rowsWritten: null,
					queryDurationMs: 0,
				},
				headers,
				lastInsertRowid:
					raw.lastInsertRowid === undefined ? undefined : Number(raw.lastInsertRowid),
			};
		}

		// Function to convert SQLite types to ColumnType enum
		function convertSqliteType(type: string | undefined): ColumnType {
			if (type === undefined) return ColumnType.BLOB;
			type = type.toUpperCase();

			if (
				type.includes('CHAR') ||
				type.includes('TEXT') ||
				type.includes('CLOB') ||
				type.includes('STRING')
			) {
				return ColumnType.TEXT;
			}

			if (type.includes('INT')) return ColumnType.INTEGER;
			if (type.includes('BLOB')) return ColumnType.BLOB;
			if (type.includes('REAL') || type.includes('DOUBLE') || type.includes('FLOAT'))
				return ColumnType.REAL;

			return ColumnType.TEXT;
		}

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
								data: transformRawResult(result),
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
								data: result.map(transformRawResult),
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
