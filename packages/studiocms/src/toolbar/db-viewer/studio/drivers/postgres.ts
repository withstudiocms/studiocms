import { setPgParser, transformPgResult } from '@outerbase/sdk-transform';
import pg, { type ConnectionConfig, type PoolClient } from 'pg';
import BaseDriver, { type Result } from './base.js';

setPgParser(pg.types);
export default class PostgresDriver extends BaseDriver {
	name = 'postgres';
	protected db: pg.Pool;

	constructor(config: ConnectionConfig) {
		super();
		this.db = new pg.Pool(config);
	}

	async close() {
		await this.db.end();
	}

	connectionName(): string {
		const poolConfig = this.db.options;
		const host = poolConfig.host || 'localhost';
		const database = poolConfig.database || 'unknown';
		return `[PostgreSQL] ${host} - ${database}`;
	}

	async execute(tx: PoolClient | pg.Pool, statement: string): Promise<Result> {
		return transformPgResult(
			await tx.query({
				text: statement,
				rowMode: 'array',
			})
		);
	}

	async query(statement: string): Promise<Result> {
		return this.execute(this.db, statement);
	}

	async batch(statements: string[]): Promise<Result[]> {
		const results: Result[] = [];
		let error: unknown;

		const tx = await this.db.connect();

		try {
			await tx.query('BEGIN');

			for (const statement of statements) {
				results.push(await this.execute(tx, statement));
			}

			await tx.query('COMMIT');
		} catch (e) {
			await tx.query('ROLLBACK');
			error = e;
		} finally {
			tx.release();
		}

		if (error) {
			if (error instanceof Error) {
				throw new Error(error.message);
			}
			throw new Error('Unexpected error');
		}

		return results;
	}

	async init() {
		return;
	}
}
