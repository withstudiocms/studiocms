import { createClient } from '@libsql/client/web';
import { transformTursoResult } from '@outerbase/sdk-transform';

// Define types for incoming messages
interface ClientRequest {
	type: 'query' | 'transaction';
	id: number;
	statement?: string;
	statements?: string[];
}

// Get reference to the iframe
const iframe = document.getElementById('sqlIframe') as HTMLIFrameElement;

// Initialize the client outside any lifecycle
const client = createClient({
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	url: iframe.dataset.url!,
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	authToken: iframe.dataset.authtoken!,
});

// Event listener to handle postMessage events
window.addEventListener('message', async (e: MessageEvent<ClientRequest>) => {
	const contentWindow = iframe.contentWindow;

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
