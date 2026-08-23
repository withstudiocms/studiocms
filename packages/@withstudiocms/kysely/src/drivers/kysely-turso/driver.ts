import {
	type CompiledQuery,
	type DatabaseConnection,
	type QueryResult,
	SqliteDriver,
	type TransactionSettings,
} from 'kysely';
import type { LibSQLClient, LibSQLDialectConfig, LibSQLTransaction } from './dialect-config.js';

const BEGIN_TRANSACTION_SYMBOL = Symbol('begin');
const COMMIT_TRANSACTION_SYMBOL = Symbol('commit');
const ROLLBACK_TRANSACTION_SYMBOL = Symbol('rollback');

export class LibSQLDriver extends SqliteDriver {
	readonly #config: LibSQLDialectConfig;
	#client: LibSQLClient | undefined;

	constructor(config: LibSQLDialectConfig) {
		super({} as never);
		this.#config = config;
	}

	override async acquireConnection(): Promise<DatabaseConnection> {
		// biome-ignore lint/style/noNonNullAssertion: `init` has already run at this point.
		return new LibSQLDatabaseConnection(this.#client!);
	}

	// @ts-expect-error needs to be fixed in core driver.
	override async beginTransaction(
		connection: DatabaseConnection,
		settings: TransactionSettings
	): Promise<void> {
		await (connection as LibSQLDatabaseConnection)[BEGIN_TRANSACTION_SYMBOL](settings);
	}

	override async commitTransaction(connection: DatabaseConnection): Promise<void> {
		await (connection as LibSQLDatabaseConnection)[COMMIT_TRANSACTION_SYMBOL]();
	}

	override async destroy(): Promise<void> {
		if (this.#client?.closed) {
			return;
		}

		this.#client?.close();
	}

	override async init(): Promise<void> {
		const { client } = this.#config;

		this.#client = isClient(client) ? client : await client();
	}

	override async releaseConnection(): Promise<void> {
		// noop
	}

	override async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
		await (connection as LibSQLDatabaseConnection)[ROLLBACK_TRANSACTION_SYMBOL]();
	}
}

function isClient(thing: unknown): thing is LibSQLClient {
	return typeof thing === 'object';
}

class LibSQLDatabaseConnection implements DatabaseConnection {
	readonly #client: LibSQLClient;
	#transaction: LibSQLTransaction | undefined;

	constructor(client: LibSQLClient) {
		this.#client = client;
	}

	async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
		const result = await (this.#transaction || this.#client).execute({
			args: [...compiledQuery.parameters],
			sql: compiledQuery.sql,
		});

		const rows: R[] = [];

		for (const row of result.rows) {
			const obj: Record<string, unknown> = {};

			for (const key in row) {
				obj[key] = row[key];
			}

			rows.push(obj as R);
		}

		return {
			insertId: result.lastInsertRowid,
			numAffectedRows: BigInt(result.rowsAffected),
			rows,
		};
	}

	streamQuery<R>(
		_compiledQuery: CompiledQuery,
		_chunkSize?: number
	): AsyncIterableIterator<QueryResult<R>> {
		throw new Error('LibSQLDialect does not support streaming.');
	}

	async [BEGIN_TRANSACTION_SYMBOL](settings: TransactionSettings): Promise<void> {
		this.#transaction = await this.#client.transaction(
			settings.accessMode === 'read only' ? 'read' : 'write'
		);
	}

	async [COMMIT_TRANSACTION_SYMBOL](): Promise<void> {
		await this.#transaction?.commit();
		this.#transaction = undefined;
	}

	async [ROLLBACK_TRANSACTION_SYMBOL](): Promise<void> {
		await this.#transaction?.rollback();
		this.#transaction = undefined;
	}
}
