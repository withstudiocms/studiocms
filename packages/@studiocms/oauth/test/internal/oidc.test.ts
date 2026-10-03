import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';

import { decodeIdToken } from '../../src/internal/oidc.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'OIDC Internal Tests';

describe(parentSuiteName, () => {
	test('decodeIdToken()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('OIDC Decoding');
		await allure.tags(...sharedTags);

		await allure.step('should decode a valid ID token payload', async (ctx) => {
			const jwt =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
			const decoded = decodeIdToken(jwt);

			await ctx.parameter('decodedPayload', JSON.stringify(decoded, null, 2));

			expect(decoded).toStrictEqual({
				sub: '1234567890',
				name: 'John Doe',
				iat: 1516239022,
			});
		});
	});
});
