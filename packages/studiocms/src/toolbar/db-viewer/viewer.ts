import type { DbQueryRequest } from './db-shared-types.js';

type SupportedDialect = 'sqlite' | 'postgres' | 'mysql' | 'turso';

/**
 * The DbStudioElement class is a custom HTML element that embeds the Outerbase Studio
 * iframe and handles communication with the Turso driver for executing SQL queries.
 */
export class DbStudioElement extends HTMLElement {
	// biome-ignore lint/complexity/noUselessConstructor: This is needed for custom elements.
	constructor() {
		super();
	}

	/**
	 * The Outerbase Studio iframe.
	 *
	 * @private
	 */
	#iframe: HTMLIFrameElement | null = null;

	/**
	 * The message handler for the iframe.
	 *
	 * @private
	 */
	#handler: (arg0: MessageEvent) => void = (_arg): void => {};

	#dialect: SupportedDialect = 'turso';

	connectedCallback() {
		this.#iframe = document.createElement('iframe');

		this.#dialect = (this.getAttribute('dialect') as SupportedDialect) || 'turso';

		this.#iframe.src = `https://studio.outerbase.com/embed/${this.#dialect}`;
		this.appendChild(this.#iframe);

		this.#handler = this.#handleMessage.bind(this);
		window.addEventListener('message', this.#handler);
	}

	disconnectedCallback() {
		window.removeEventListener('message', this.#handler);
		this.#iframe?.remove();
	}

	/**
	 * Handles messages from the iframe.
	 *
	 */
	async #handleMessage(event: MessageEvent) {
		const data = event.data;
		switch (data?.type) {
			case 'transaction':
			case 'query': {
				console.debug('Executing %s:', data.type, data);
				const result = await this.#executeQuery(data);
				this.#iframe?.contentWindow?.postMessage(result, '*');
				break;
			}
		}
	}

	/**
	 * Executes a SQL request and returns the result.
	 */
	async #executeQuery(request: DbQueryRequest) {
		const response = await fetch('/studiocms_api/db-studio/query', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(request),
		});
		if (response.ok) {
			const result = await response.json();
			console.debug('Query result:', result);
			return result;
		}
		const error = await response.text();
		console.error('Error executing query:', error);
		return { type: request.type, id: request.id, error };
	}
}
