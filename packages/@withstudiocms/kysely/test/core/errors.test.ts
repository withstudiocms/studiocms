import { ParseError, Unexpected } from 'effect/ParseResult';
import { describe, expect } from 'vitest';
import { MigratorError, NotFoundError, QueryError, QueryParseError } from '../../src/core/errors';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const localSuiteName = 'Error Classes';

describe(parentSuiteName, () => {
	const test = allureTester({
		suiteName: localSuiteName,
		suiteParentName: parentSuiteName,
	});

	test('QueryParseError is instance of TaggedError', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'QueryParseError',
			tags: [...sharedTags, 'core', 'errors'],
		});
		const error = new QueryParseError({
			parseError: new ParseError({ issue: new Unexpected('Unexpected token') }),
		});

		expect(error).toBeInstanceOf(QueryParseError);
		expect(error._tag).toBe('QueryParseError');
	});

	test('QueryError is instance of TaggedError', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'QueryError',
			tags: [...sharedTags, 'core', 'errors'],
		});
		const error = new QueryError({
			message: 'Query failed',
		});

		expect(error).toBeInstanceOf(QueryError);
		expect(error._tag).toBe('QueryError');
	});

	test('NotFoundError is instance of TaggedError', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'NotFoundError',
			tags: [...sharedTags, 'core', 'errors'],
		});
		const error = new NotFoundError();

		expect(error).toBeInstanceOf(NotFoundError);
		expect(error._tag).toBe('NotFoundError');
	});

	test('MigratorError is instance of TaggedError', async ({ setupAllure }) => {
		await setupAllure({
			subSuiteName: 'MigratorError',
			tags: [...sharedTags, 'core', 'errors'],
		});
		const error = new MigratorError({
			cause: 'Migration failed',
		});

		expect(error).toBeInstanceOf(MigratorError);
		expect(error._tag).toBe('MigratorError');
	});
});
