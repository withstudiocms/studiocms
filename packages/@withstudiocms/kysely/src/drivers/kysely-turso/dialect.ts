import {
	type DatabaseIntrospector,
	type Dialect,
	type DialectAdapter,
	type Driver,
	type Kysely,
	type QueryCompiler,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from 'kysely';
import type { LibSQLDialectConfig } from './dialect-config.js';
import { LibSQLDriver } from './driver.js';
import { freeze } from './utils.js';

export class LibSQLDialect implements Dialect {
	readonly #config: LibSQLDialectConfig;

	constructor(config: LibSQLDialectConfig) {
		this.#config = freeze({ ...config });
	}

	createAdapter(): DialectAdapter {
		return new SqliteAdapter();
	}

	createDriver(): Driver {
		return new LibSQLDriver(this.#config);
	}

	// biome-ignore lint/suspicious/noExplicitAny: this is fine.
	createIntrospector(db: Kysely<any>): DatabaseIntrospector {
		return new SqliteIntrospector(db);
	}

	createQueryCompiler(): QueryCompiler {
		return new SqliteQueryCompiler();
	}
}
