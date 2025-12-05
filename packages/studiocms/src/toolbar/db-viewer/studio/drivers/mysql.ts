import { ColumnType } from '@outerbase/sdk-transform';
import { createPool, type Pool, type PoolConnection, Types } from 'mysql2/promise';
import type BaseDriver from './base.js';
import type { Result, ResultHeader } from './base.js';

enum MySQLType {
	MYSQL_TYPE_DECIMAL = 0,
	MYSQL_TYPE_TINY = 1,
	MYSQL_TYPE_SHORT = 2,
	MYSQL_TYPE_LONG = 3,
	MYSQL_TYPE_FLOAT = 4,
	MYSQL_TYPE_DOUBLE = 5,
	MYSQL_TYPE_NULL = 6,
	MYSQL_TYPE_TIMESTAMP = 7,
	MYSQL_TYPE_LONGLONG = 8,
	MYSQL_TYPE_INT24 = 9,
	MYSQL_TYPE_DATE = 10,
	MYSQL_TYPE_TIME = 11,
	MYSQL_TYPE_DATETIME = 12,
	MYSQL_TYPE_YEAR = 13,
	MYSQL_TYPE_NEWDATE = 14 /**< Internal to MySQL. Not used in protocol */,
	MYSQL_TYPE_VARCHAR = 15,
	MYSQL_TYPE_BIT = 16,
	MYSQL_TYPE_TIMESTAMP2 = 17,
	MYSQL_TYPE_DATETIME2 = 18 /**< Internal to MySQL. Not used in protocol */,
	MYSQL_TYPE_TIME2 = 19 /**< Internal to MySQL. Not used in protocol */,
	MYSQL_TYPE_TYPED_ARRAY = 20 /**< Used for replication only */,
	MYSQL_TYPE_INVALID = 243,
	MYSQL_TYPE_BOOL = 244 /**< Currently just a placeholder */,
	MYSQL_TYPE_JSON = 245,
	MYSQL_TYPE_NEWDECIMAL = 246,
	MYSQL_TYPE_ENUM = 247,
	MYSQL_TYPE_SET = 248,
	MYSQL_TYPE_TINY_BLOB = 249,
	MYSQL_TYPE_MEDIUM_BLOB = 250,
	MYSQL_TYPE_LONG_BLOB = 251,
	MYSQL_TYPE_BLOB = 252,
	MYSQL_TYPE_VAR_STRING = 253,
	MYSQL_TYPE_STRING = 254,
	MYSQL_TYPE_GEOMETRY = 255,
}

function mapDataType(columnType: number): ColumnType {
	// List of all column type
	// https://dev.mysql.com/doc/dev/mysql-server/latest/field__types_8h_source.html
	if (columnType === MySQLType.MYSQL_TYPE_JSON) {
		return ColumnType.TEXT;
	}
	if (
		[
			MySQLType.MYSQL_TYPE_TINY,
			MySQLType.MYSQL_TYPE_SHORT,

			MySQLType.MYSQL_TYPE_LONGLONG,
			MySQLType.MYSQL_TYPE_INT24,
			MySQLType.MYSQL_TYPE_BIT,
		].includes(columnType)
	) {
		return ColumnType.INTEGER;
	}
	if (
		[MySQLType.MYSQL_TYPE_LONG, MySQLType.MYSQL_TYPE_FLOAT, MySQLType.MYSQL_TYPE_DOUBLE].includes(
			columnType
		)
	) {
		return ColumnType.REAL;
	}
	if ([MySQLType.MYSQL_TYPE_DECIMAL, MySQLType.MYSQL_TYPE_NEWDECIMAL].includes(columnType)) {
		return ColumnType.REAL;
	}
	if (
		[
			MySQLType.MYSQL_TYPE_GEOMETRY,
			MySQLType.MYSQL_TYPE_MEDIUM_BLOB,
			MySQLType.MYSQL_TYPE_LONG_BLOB,
		].includes(columnType)
	) {
		return ColumnType.TEXT;
	}
	if ([MySQLType.MYSQL_TYPE_DATE].includes(columnType)) {
		return ColumnType.TEXT;
	}
	if ([MySQLType.MYSQL_TYPE_TIME, MySQLType.MYSQL_TYPE_TIME2].includes(columnType)) {
		return ColumnType.TEXT;
	}
	if (
		[
			MySQLType.MYSQL_TYPE_DATETIME,
			MySQLType.MYSQL_TYPE_DATETIME2,
			MySQLType.MYSQL_TYPE_TIMESTAMP,
			MySQLType.MYSQL_TYPE_TIMESTAMP2,
		].includes(columnType)
	) {
		return ColumnType.TEXT;
	}

	return ColumnType.TEXT;
}

interface ColumnDefinition {
	_buf: Buffer;
	_orgTableLength: number;
	_orgTableStart: number;
	_orgNameLength: number;
	_orgNameStart: number;
	type: number;
	typeName: string;
	name: string;
	flags: number;
}

export interface MySqlConnectionConfig {
	database: string;
	user: string;
	password: string;
	host: string;
	port: number;
}

export default class MySQLDriver implements BaseDriver {
	// @ts-expect-error
	db: Pool;
	connectionString: MySqlConnectionConfig;
	name = 'mysql';

	constructor(connectionString: MySqlConnectionConfig) {
		this.connectionString = connectionString;
	}

	protected async getConnection() {
		if (this.db) return this.db;
		this.db = createPool({
			...this.connectionString,
			rowsAsArray: true,
			dateStrings: true,
			pool: { min: 1, max: 1 },
			connectionLimit: 1,
		});
		return this.db;
	}

	connectionName(): string {
		return `[MySQL] ${this.connectionString.database} - ${this.connectionString.host}`;
	}

	async init() {
		return;
	}

	async execute(conn: Pool | PoolConnection, statement: string): Promise<Result> {
		const [result, fieldsets] = await conn.execute(statement);

		// If it is not an array, it means
		// it is not a SELECT statement
		if (!Array.isArray(result)) {
			return {
				headers: [],
				rows: [],
				stat: {
					queryDurationMs: null,
					rowsAffected: result.affectedRows,
					rowsRead: null,
					rowsWritten: null,
				},
				lastInsertRowid: result.insertId,
			};
		}

		const headerSet = new Set();
		const headers = (fieldsets as unknown as ColumnDefinition[]).map((raw): ResultHeader => {
			let renameColName = raw.name;

			for (let i = 0; i < 20; i++) {
				if (!headerSet.has(renameColName)) break;
				renameColName = `__${raw.name}_${i}`;
			}

			return {
				displayName: raw.name,
				name: renameColName,
				// @ts-expect-error
				originalType: ((Types[raw.type] as string) ?? '').toLowerCase(),
				type: mapDataType(raw.type),
			};
		});

		const rows = (result as unknown[][]).map((resultRow) => {
			return headers.reduce(
				(row, header, idx) => {
					const value = resultRow[idx];
					if (value !== null) {
						if (header.originalType === 'json') {
							row[header.name] = JSON.stringify(value as string);
						} else if (
							header.originalType === 'blob' ||
							header.originalType === 'medium_blob' ||
							header.originalType === 'long_blob' ||
							header.originalType === 'tiny_blob'
						) {
							if (typeof value === 'string') {
								row[header.name] = value;
							} else {
								row[header.name] = [...new Uint8Array(value as Buffer)];
							}
						} else if (header.originalType === 'geometry') {
							const point = value as { x: number; y: number };
							if (!Array.isArray(point) && point.x !== undefined) {
								row[header.name] = `POINT(${point.x} ${point.y})`;
							} else {
								row[header.name] = value;
							}
						} else {
							row[header.name] = value;
						}
					} else {
						row[header.name] = value;
					}

					return row;
				},
				{} as Record<string, unknown>
			);
		});

		return {
			headers,
			rows,
			stat: {
				queryDurationMs: null,
				// @ts-expect-error
				rowsAffected: null,
				rowsRead: null,
				rowsWritten: null,
			},
			// @ts-expect-error
			lastInsertRowid: null,
		};
	}

	async query(statement: string): Promise<Result> {
		const conn = await this.getConnection();
		return await this.execute(conn, statement);
	}

	async batch(statements: string[]): Promise<Result[]> {
		const pool = await this.getConnection();
		const conn = await pool.getConnection();

		try {
			await conn.beginTransaction();

			const resultCollection: Result[] = [];

			for (const statement of statements) {
				resultCollection.push(await this.execute(conn, statement));
			}

			await conn.commit();
			pool.releaseConnection(conn);
			return resultCollection;
		} catch (e) {
			console.log(e);
			await conn.rollback();
			pool.releaseConnection(conn);
			// @ts-expect-error
			throw new Error(e);
		}
	}
}
