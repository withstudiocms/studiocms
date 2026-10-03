/** biome-ignore-all lint/suspicious/noExplicitAny: allow for dynamic functions */
import { Effect } from 'effect';
import type { Kysely } from 'kysely';
import { getDialect } from './introspection.js';
import { makeSql } from './sql.js';
import type { DatabaseDialect, TableDefinition, TriggerDefinition } from './types.js';

/**
 * Quote a SQL identifier according to the given database dialect.
 *
 * Wraps the provided identifier with the appropriate quote characters:
 * - MySQL: backticks (`identifier`)
 * - SQLite/Postgres: double quotes ("identifier")
 *
 * @param dialect - The target DatabaseDialect ('mysql' | 'sqlite' | 'postgres').
 * @param ident - The identifier to quote (e.g. table or column name).
 * @returns The identifier wrapped in the dialect-specific quoting characters.
 *
 * @remarks
 * This function performs simple quoting only and does not escape embedded quote
 * characters inside `ident`. Callers should ensure `ident` is a valid, trusted
 * identifier or perform necessary escaping to avoid malformed SQL.
 *
 * @example
 * quoteIdent('mysql', 'users')    // -> "`users`"
 * quoteIdent('postgres', 'users') // -> "\"users\""
 */
export function quoteIdent(dialect: DatabaseDialect, ident: string): string {
	switch (dialect) {
		case 'mysql':
			return `\`${ident}\``;
		case 'sqlite':
		case 'postgres':
			return `"${ident}"`;
	}
}

/**
 * Convert a string value to its uppercase form.
 *
 * @typeParam T - Input string type (can be a string literal type) accepted by the function.
 * @param v - The string value to convert to uppercase.
 * @returns The uppercase representation of the input as a plain string.
 *
 * @remarks
 * This function delegates to String.prototype.toUpperCase at runtime, returning a new string.
 * Note that even if a generic type parameter is provided, the return type is always `string` (not `T`).
 *
 * @example
 * const kw = toUpperKeyword("select"); // "SELECT"
 */
export function toUpperKeyword<T extends string>(v: T): string {
	return v.toUpperCase();
}

/**
 * Build a CREATE TRIGGER statement for SQLite from a trigger definition.
 *
 * @param table - The target table name (unquoted). The function will quote this identifier for SQLite.
 * @param t - Trigger definition containing at least:
 *   - name: string — trigger name (unquoted; will be quoted for SQLite)
 *   - timing: string — timing keyword (e.g. "BEFORE" or "AFTER"); it will be normalized to an upper-case SQL keyword
 *   - event: string — event keyword (e.g. "INSERT", "UPDATE", "DELETE"); it will be normalized to an upper-case SQL keyword
 *   - bodySQL: string — the trigger body SQL (one or more statements). This is placed inside a BEGIN...END block.
 *
 * @returns A SQL string that creates the trigger if it does not already exist. The generated SQL:
 *   - uses CREATE TRIGGER IF NOT EXISTS
 *   - quotes identifiers appropriately for SQLite
 *   - places the trigger body inside a BEGIN ... END; block
 *   - includes the implicit "FOR EACH ROW" clause used by SQLite row-level triggers
 *
 * @remarks
 * - Identifiers are quoted via quoteIdent('sqlite', ...).
 * - Timing and event values are normalized via toUpperKeyword(...) to produce valid SQL keywords.
 * - The function appends the final END; so bodySQL should contain valid statements and any required internal semicolons.
 *
 * @example
 * // Given:
 * // t = { name: 'log_insert', timing: 'before', event: 'insert', bodySQL: "INSERT INTO audit (...) VALUES (...);" }
 * // buildSQLiteTriggerSQL('users', t) -> generates a CREATE TRIGGER IF NOT EXISTS ... FOR EACH ROW BEGIN ... END;
 */
export function buildSQLiteTriggerSQL(table: string, t: TriggerDefinition): string {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	// SQLite uses FOR EACH ROW implicitly; BEGIN...END allows multi-statement bodies
	return `CREATE TRIGGER IF NOT EXISTS ${quoteIdent('sqlite', t.name)} ${timing} ${event} ON ${quoteIdent('sqlite', table)}
FOR EACH ROW
BEGIN
${t.bodySQL}
END;`;
}

/**
 * Build a MySQL CREATE TRIGGER statement string for the given table and trigger definition.
 *
 * Produces a complete CREATE TRIGGER ... FOR EACH ROW ...; statement suitable for execution by
 * programmatic MySQL clients (no DELIMITER changes are applied).
 *
 * Behavior:
 * - Converts the trigger timing and event to upper-case SQL keywords (e.g. BEFORE/AFTER, INSERT/UPDATE/DELETE).
 * - Quotes the trigger name and table identifier for MySQL using the module's quoting helper.
 * - Trims t.bodySQL and, if it does not already start with a BEGIN block (case-insensitive), wraps the
 *   body in a BEGIN ... END block so the body is a valid compound statement.
 * - Appends a terminating semicolon to the constructed SQL.
 *
 * @param table - The table name the trigger is created on.
 * @param t - Trigger definition containing at least:
 *   - name: trigger name
 *   - timing: trigger timing (e.g. "before" | "after")
 *   - event: trigger event (e.g. "insert" | "update" | "delete")
 *   - bodySQL: the SQL body of the trigger
 * @returns The full CREATE TRIGGER statement string ready to be executed against MySQL.
 *
 * @example
 * // returns a string like:
 * // CREATE TRIGGER `tr_name` BEFORE INSERT ON `tbl`
 * // FOR EACH ROW
 * // BEGIN
 * //   -- body SQL here
 * // END;
 */
export function buildMySQLTriggerSQL(table: string, t: TriggerDefinition): string {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	// MySQL requires FOR EACH ROW. Programmatic clients don't need DELIMITER changes.
	const body = t.bodySQL.trim();
	/* v8 ignore start */
	const bodyWrapped = body.toUpperCase().startsWith('BEGIN')
		? body
		: `BEGIN
${body}
END`;
	/* v8 ignore stop */
	return `CREATE TRIGGER ${quoteIdent('mysql', t.name)} ${timing} ${event} ON ${quoteIdent('mysql', table)}
FOR EACH ROW
${bodyWrapped};`;
}

/**
 * Build the SQL statements required to create a PostgreSQL trigger and its
 * backing PL/pgSQL trigger function for a given table and trigger definition.
 *
 * The function returns two SQL strings:
 *  - fnSQL: a CREATE OR REPLACE FUNCTION statement that defines a trigger
 *    function returning "trigger" and containing the provided trigger body.
 *  - trgSQL: a CREATE TRIGGER statement that attaches the trigger function
 *    to the specified table for each row and with the specified timing/event.
 *
 * Notes:
 *  - The trigger timing (e.g. "before" | "after") and event (e.g. "insert" | "update" | "delete")
 *    are normalized to uppercase keywords via toUpperKeyword before embedding
 *    into the SQL.
 *  - Identifiers (schema, table, trigger and function names) are passed through
 *    quoteIdent('postgres', ...) to ensure proper quoting/escaping for the
 *    PostgreSQL "postgres" schema.
 *  - The trigger function name is constructed as `${table}_${t.name}_fn`.
 *  - The trigger executes the created function with no arguments:
 *    EXECUTE FUNCTION "<schema>"."<fnName>()".
 *  - The function's RETURN value is chosen based on the event: for 'delete'
 *    it returns OLD, otherwise it returns NEW.
 *  - The provided t.bodySQL is injected verbatim into the function body and
 *    therefore must be a valid PL/pgSQL fragment and appropriately sanitized.
 *
 * @param table - The target table name (unquoted). Used to construct the function name
 *                and to build the CREATE TRIGGER statement.
 * @param t - TriggerDefinition containing at least:
 *            - name: the trigger name,
 *            - timing: trigger timing keyword (e.g. 'before'|'after'),
 *            - event: trigger event (e.g. 'insert'|'update'|'delete'),
 *            - bodySQL: the PL/pgSQL code to run inside the trigger function.
 * @returns An object with:
 *          - fnSQL: string containing the CREATE OR REPLACE FUNCTION SQL,
 *          - trgSQL: string containing the CREATE TRIGGER SQL.
 *
 * @example
 * // returns { fnSQL: 'CREATE OR REPLACE FUNCTION "postgres"."users_mytrig_fn"() ...',
 * //           trgSQL: 'CREATE TRIGGER "postgres"."mytrig" BEFORE INSERT ON "postgres"."users" ...' }
 */
export function buildPostgresTriggerSQL(table: string, t: TriggerDefinition) {
	const timing = toUpperKeyword(t.timing); // BEFORE|AFTER
	const event = toUpperKeyword(t.event); // INSERT|UPDATE|DELETE
	const fnName = `${table}_${t.name}_fn`;
	const returnValue = t.event === 'delete' ? 'OLD' : 'NEW';

	const fnSQL = `CREATE OR REPLACE FUNCTION ${quoteIdent('postgres', fnName)}()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
${t.bodySQL}
RETURN ${returnValue};
END
$$;`;

	const trgSQL = `CREATE TRIGGER ${quoteIdent('postgres', t.name)} ${timing} ${event} ON ${quoteIdent('postgres', table)}
FOR EACH ROW
EXECUTE FUNCTION ${quoteIdent('postgres', fnName)}();`;

	return { fnSQL, trgSQL };
}

/* v8 ignore start */

/**
 * Ensure that all triggers declared on a table are present in the database, creating any that are missing.
 *
 * This effectful generator:
 * - Obtains the current database dialect for the provided Kysely instance.
 * - Iterates over the triggers declared on the provided table definition.
 * - Skips triggers whose names are listed in `existingTriggers`.
 * - For each missing trigger, logs progress and emits the appropriate SQL to create the trigger:
 *   - SQLite: builds and executes a single trigger SQL statement.
 *   - MySQL: builds and executes a single trigger SQL statement.
 *   - Postgres: builds and executes both a function SQL statement and a trigger SQL statement.
 * - Logs once the trigger has been created.
 *
 * Notes:
 * - If `tableDef.triggers` is undefined or empty, the effect completes immediately.
 * - The operation is performed as Effects — it must be executed within the surrounding Effect runtime.
 * - SQL execution and logging are side effects; any database errors will cause the produced effect to fail.
 * - Trigger name comparison is performed against the strings in `existingTriggers` (exact match).
 *
 * @param db - The Kysely database instance for the target database.
 * @param tableDef - The table definition that may contain a `triggers` array describing triggers to ensure.
 * @param existingTriggers - An array of trigger names already present in the database; triggers with names in this list will not be recreated.
 * @returns An effect that, when executed, creates any missing triggers and resolves once all creations (and logs) complete.
 *
 * @throws If dialect detection or any SQL execution fails, the returned effect will fail with the underlying error.
 */
export const addMissingTriggersForTable = Effect.fn(function* (
	db: Kysely<any>,
	tableDef: TableDefinition,
	existingTriggers: string[]
) {
	if (!tableDef.triggers || tableDef.triggers.length === 0) return;

	const dialect = yield* getDialect(db);

	yield* Effect.forEach(
		tableDef.triggers,
		Effect.fn(function* (t) {
			if (existingTriggers.includes(t.name)) return;

			yield* Effect.logDebug(`Creating trigger ${t.name} on ${tableDef.name}...`);

			switch (dialect) {
				case 'sqlite': {
					const sqlText = buildSQLiteTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(sqlText).execute(db));
					break;
				}
				case 'mysql': {
					const sqlText = buildMySQLTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(sqlText).execute(db));
					break;
				}
				case 'postgres': {
					const { fnSQL, trgSQL } = buildPostgresTriggerSQL(tableDef.name, t);
					yield* makeSql((sql) => sql.raw(fnSQL).execute(db));
					yield* makeSql((sql) => sql.raw(trgSQL).execute(db));
					break;
				}
			}

			yield* Effect.logDebug(`Trigger ${t.name} created on ${tableDef.name}`);
		})
	);
});

/**
 * Drops database triggers that exist for a table but are no longer defined in the provided table definition.
 *
 * This function computes the set difference between the triggers currently present in the database
 * (existingTriggers) and the triggers declared on the provided table definition (tableDef.triggers).
 * Any trigger names present in the database but not declared in the table definition will be dropped.
 *
 * The implementation:
 * - Resolves the current SQL dialect for the provided Kysely database instance.
 * - For each trigger to drop, emits a dialect-appropriate DROP TRIGGER statement (using IF EXISTS for safety)
 *   and executes it against the database. For PostgreSQL the statement includes the "ON <table>" clause.
 * - Logs informational messages before and after attempting to drop each trigger.
 * - No action is taken if there are no removed triggers to drop.
 *
 * Safety and behavior notes:
 * - Uses DROP TRIGGER IF EXISTS to avoid errors when a trigger is already absent.
 * - Trigger names and table identifiers are quoted via quoteIdent to avoid SQL injection and identifier issues.
 * - Operations have side effects on the database and will be persisted when executed.
 * - Underlying SQL execution may fail and propagate errors from the database driver or execution layer.
 * - Only the supported dialects ("sqlite", "mysql", "postgres") are handled explicitly; other dialects will result
 *   in no drop SQL being emitted by this implementation.
 *
 * @param db - A Kysely database instance connected to the target database.
 * @param tableDef - The table definition describing the desired schema for the table, including an optional
 *                   "triggers" array whose elements expose a "name" property.
 * @param existingTriggers - An array of trigger names currently present in the database for the target table.
 *
 * @returns An Effect that performs the drop operations and resolves when all drops have completed.
 *
 * @example
 * // Within an Effect generator
 * yield* dropRemovedTriggersForTable(db, tableDefinition, currentTriggerNames);
 */
export const dropRemovedTriggersForTable = Effect.fn(function* (
	db: Kysely<any>,
	tableDef: TableDefinition,
	existingTriggers: string[]
) {
	const defined = new Set((tableDef.triggers ?? []).map((t) => t.name));
	const toDrop = existingTriggers.filter((name) => !defined.has(name));

	if (toDrop.length === 0) return;

	const dialect = yield* getDialect(db);

	yield* Effect.forEach(
		toDrop,
		Effect.fn(function* (trigName) {
			yield* Effect.logDebug(`Dropping trigger ${trigName} from ${tableDef.name}...`);

			switch (dialect) {
				case 'sqlite': {
					yield* makeSql((sql) =>
						sql.raw(`DROP TRIGGER IF EXISTS ${quoteIdent('sqlite', trigName)};`).execute(db)
					);
					break;
				}
				case 'mysql': {
					yield* makeSql((sql) =>
						sql.raw(`DROP TRIGGER IF EXISTS ${quoteIdent('mysql', trigName)};`).execute(db)
					);
					break;
				}
				case 'postgres': {
					yield* makeSql((sql) =>
						sql
							.raw(
								`DROP TRIGGER IF EXISTS ${quoteIdent('postgres', trigName)} ON ${quoteIdent(
									'postgres',
									tableDef.name
								)};`
							)
							.execute(db)
					);
					break;
				}
			}

			yield* Effect.logDebug(`Trigger ${trigName} dropped from ${tableDef.name}`);
		})
	);
});

/* v8 ignore stop */
