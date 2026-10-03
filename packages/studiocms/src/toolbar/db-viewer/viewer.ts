import { integrationsClient } from 'studiocms:client/apiClients';
import * as Effect from 'effect/Effect';

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
		Object.assign(this.#iframe.style, {
			height: '100%',
			width: '100%',
			border: 'none',
		});

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
		// Only accept messages from the Outerbase Studio iframe
		if (event.origin !== 'https://studio.outerbase.com') {
			return;
		}
		const payload = event.data;
		switch (payload?.type) {
			case 'transaction':
			case 'query': {
				console.debug('Executing %s:', payload.type, payload);
				const result = await this.#effectExecuteQuery({ payload });
				this.#iframe?.contentWindow?.postMessage(result, '*');
				break;
			}
		}
	}

	/**
	 * Executes a SQL query or transaction
	 */
	async #effectExecuteQuery(
		request:
			| {
					readonly payload: {
						readonly id: number;
						readonly type: 'query';
						readonly statement: string;
					};
					readonly withResponse?: false | undefined;
			  }
			| {
					readonly payload: {
						readonly id: number;
						readonly type: 'transaction';
						readonly statements: readonly string[];
					};
					readonly withResponse?: false | undefined;
			  }
	) {
		return await integrationsClient.pipe(
			Effect.flatMap((client) => client.dbStudio.dbStudioQuery(request)),
			Effect.catchAll((error) => {
				console.error('Error executing query:', error);
				return Effect.succeed({
					type: request.payload.type,
					id: request.payload.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}),
			Effect.runPromise
		);
	}
}
