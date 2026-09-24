// https://github.com/tursodatabase/turso/blob/main/packages/turso-serverless/src/compat.ts

export interface LibSQLDialectConfig {
	client: LibSQLClient | (() => LibSQLClient | Promise<LibSQLClient>);
}

export interface LibSQLClient extends LibSQLExecutor {
	close: () => void;
	closed: boolean;
	transaction: (mode?: LibSQLTransactionMode) => Promise<LibSQLTransaction>;
}

export interface LibSQLTransaction extends LibSQLExecutor {
	commit: () => Promise<void>;
	rollback: () => Promise<void>;
}

interface LibSQLExecutor {
	// // biome-ignore lint/suspicious/noExplicitAny: this is fine.
	// execute(this: void, sql: string, args?: any[]): Promise<LibSQLResultSet>
	execute(this: void, stmt: LibSQLInStatement): Promise<LibSQLResultSet>;
}

type LibSQLTransactionMode = 'write' | 'read' | 'deferred';

interface LibSQLInStatement {
	sql: string;
	// biome-ignore lint/suspicious/noExplicitAny: this is fine.
	args?: any[];
}

interface LibSQLResultSet {
	lastInsertRowid: bigint | undefined;
	rows: Record<string, unknown>[];
	rowsAffected: number;
}
