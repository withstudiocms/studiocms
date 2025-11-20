import { describe, expect } from 'vitest';
import {
	buildMySQLTriggerSQL,
	buildPostgresTriggerSQL,
	buildSQLiteTriggerSQL,
	quoteIdent,
	toUpperKeyword,
} from '../../src/utils/triggers';
import type { TriggerDefinition } from '../../src/utils/types';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Trigger Utilities';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName: localSuiteName,
	});

	[
		{
			dialect: 'mysql' as const,
			ident: 'columnName',
			expected: '`columnName`',
		},
		{
			dialect: 'postgres' as const,
			ident: 'columnName',
			expected: '"columnName"',
		},
		{
			dialect: 'sqlite' as const,
			ident: 'columnName',
			expected: '"columnName"',
		},
	].forEach(({ dialect, ident, expected }) => {
		test(`quoteIdent correctly quotes identifier for ${dialect}`, async ({ setupAllure, step }) => {
			await setupAllure({
				subSuiteName: 'quoteIdent Utility',
				tags: [...sharedTags, `dialect:${dialect}`],
			});

			await step(`should quote identifier "${ident}" correctly`, async (ctx) => {
				await ctx.parameter('dialect', dialect);
				await ctx.parameter('identifier', ident);
				await ctx.parameter('expected', expected);

				const result = quoteIdent(dialect, ident);
				await ctx.parameter('result', result);

				expect(result).toBe(expected);
			});
		});
	});

	['select', 'from', 'where', 'insert', 'update', 'delete', 'join'].forEach((word) => {
		test(`toUpperKeyword correctly uppercases SQL keyword "${word}"`, async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'toUpperKeyword Utility',
				tags: [...sharedTags],
			});

			await step(`should uppercase keyword "${word}" correctly`, async (ctx) => {
				await ctx.parameter('keyword', word);

				const result = toUpperKeyword(word);
				await ctx.parameter('result', result);

				expect(result).toBe(word.toUpperCase());
			});
		});
	});

	test('buildSQLiteTriggerSQL builds correct SQL', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'buildSQLiteTriggerSQL Utility',
			tags: [...sharedTags, 'dialect:sqlite'],
		});

		await step('should build correct SQLite trigger SQL', async (ctx) => {
			const triggerName = 'my_trigger';
			const tableName = 'my_table';
			const timing = 'before';
			const event = 'insert';
			const body = "BEGIN SELECT RAISE(ABORT, 'triggered'); END;";

			ctx.parameter('triggerName', triggerName);
			ctx.parameter('tableName', tableName);
			ctx.parameter('timing', timing);
			ctx.parameter('event', event);
			ctx.parameter('body', body);

			const result = buildSQLiteTriggerSQL(triggerName, {
				bodySQL: body,
				event,
				name: triggerName,
				timing,
			});
			ctx.parameter('result', result);

			const expectedSQL = `CREATE TRIGGER IF NOT EXISTS ${quoteIdent('sqlite', triggerName)} ${timing.toUpperCase()} ${event.toUpperCase()} ON ${quoteIdent(
				'sqlite',
				triggerName
			)}
FOR EACH ROW
BEGIN
${body}
END;`;
			expect(result).toBe(expectedSQL);
		});
	});

	test('buildMySQLTriggerSQL builds correct SQL', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'buildMySQLTriggerSQL Utility',
			tags: [...sharedTags, 'dialect:mysql'],
		});

		await step('should build correct MySQL trigger SQL', async (ctx) => {
			const triggerName = 'my_trigger';
			const tableName = 'my_table';
			const timing = 'before';
			const event = 'insert';
			const body = "BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'triggered' END";

			ctx.parameter('triggerName', triggerName);
			ctx.parameter('tableName', tableName);
			ctx.parameter('timing', timing);
			ctx.parameter('event', event);
			ctx.parameter('body', body);

			const result = buildMySQLTriggerSQL(triggerName, {
				bodySQL: body,
				event,
				name: triggerName,
				timing,
			});
			ctx.parameter('result', result);

			const expectedSQL = `CREATE TRIGGER ${quoteIdent('mysql', triggerName)} ${timing.toUpperCase()} ${event.toUpperCase()} ON ${quoteIdent(
				'mysql',
				triggerName
			)}
FOR EACH ROW
${body};`;
			expect(result).toBe(expectedSQL);
		});
	});

	test('buildPostgresTriggerSQL builds correct SQL', async ({ setupAllure, step }) => {
		await setupAllure({
			subSuiteName: 'buildPostgresTriggerSQL Utility',
			tags: [...sharedTags, 'dialect:postgres'],
		});

		await step('should build correct Postgres trigger SQL', async (ctx) => {
			const table = 'my_table';
			const t: TriggerDefinition = {
				name: 'my_trigger',
				timing: 'before',
				event: 'insert',
				bodySQL: "RAISE EXCEPTION 'triggered'; RETURN NEW;",
			};

			ctx.parameter('table', table);
			ctx.parameter('trigger', JSON.stringify(t));

			const result = buildPostgresTriggerSQL(table, t);
			ctx.parameter('result', JSON.stringify(result));

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

			const expected = { fnSQL, trgSQL };
			expect(result).toEqual(expected);
		});
	});
});
