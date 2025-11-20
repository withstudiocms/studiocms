import { Cause, Effect } from 'effect';
import { describe, expect } from 'vitest';
import { DialectDeterminationError, handleCause, SqlError } from '../../src/utils/errors';
import { allureTester, parentSuiteName, sharedTags } from '../test-utils';

const suiteName = 'Error Utilities';

describe('handleCause', () => {
	const test = allureTester({
		suiteParentName: parentSuiteName,
		suiteName,
	});

	[
		{
			errorInstance: new DialectDeterminationError({ cause: 'Test error' }),
			expected: 'Migration failed. See logs for details.',
		},
		{
			errorInstance: new SqlError({ cause: 'SQL execution failed' }),
			expected: 'Migration failed. See logs for details.',
		},
	].forEach(({ errorInstance, expected }) => {
		test(`produces an effect that dies with the correct error message for ${errorInstance.name}`, async ({
			setupAllure,
			step,
		}) => {
			await setupAllure({
				subSuiteName: 'handleCause Utility',
				tags: [...sharedTags, `errorInstance:${errorInstance.name}`],
			});

			await step(`should handle ${errorInstance.name} correctly`, async (ctx) => {
				await ctx.parameter('errorInstance', errorInstance.name);
				const innerEffect = await Effect.runPromise(handleCause(Cause.fail(errorInstance)));

				await expect(Effect.runPromise(innerEffect)).rejects.toThrow(expected);
			});
		});
	});
});
