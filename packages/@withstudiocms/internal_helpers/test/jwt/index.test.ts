import * as allure from 'allure-js-commons';
import { describe, expect, test } from 'vitest';
import { decodeJWT, encodeJWT, parseJWT } from '../../src/jwt/index.js';
import { parentSuiteName, sharedTags } from '../test-utils.js';

const localSuiteName = 'jwt';

const exampleToken =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const exampleHeader = { alg: 'HS256', typ: 'JWT' };
const examplePayload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };
const exampleSignature = new Uint8Array([
	73, 249, 74, 199, 4, 73, 72, 199, 138, 40, 93, 144, 79, 135, 240, 164, 199, 137, 127, 126, 143,
	58, 78, 178, 37, 95, 218, 117, 11, 44, 195, 151,
]);
const exampleSigningInput = new Uint8Array([
	101, 121, 74, 104, 98, 71, 99, 105, 79, 105, 74, 73, 85, 122, 73, 49, 78, 105, 73, 115, 73, 110,
	82, 53, 99, 67, 73, 54, 73, 107, 112, 88, 86, 67, 74, 57, 46, 101, 121, 74, 122, 100, 87, 73, 105,
	79, 105, 73, 120, 77, 106, 77, 48, 78, 84, 89, 51, 79, 68, 107, 119, 73, 105, 119, 105, 98, 109,
	70, 116, 90, 83, 73, 54, 73, 107, 112, 118, 97, 71, 52, 103, 82, 71, 57, 108, 73, 105, 119, 105,
	97, 87, 70, 48, 73, 106, 111, 120, 78, 84, 69, 50, 77, 106, 77, 53, 77, 68, 73, 121, 102, 81,
]);

describe(parentSuiteName, () => {
	test('parseJWT()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('parseJWT()');
		await allure.tags(...sharedTags);

		await allure.step(
			'parses a valid JWT into [header, payload, signature, signingInput]',
			async (ctx) => {
				expect(parseJWT(exampleToken)).toStrictEqual([
					exampleHeader,
					examplePayload,
					exampleSignature,
					exampleSigningInput,
				]);
				await ctx.parameter('token', exampleToken);
				await ctx.parameter('alg', exampleHeader.alg);
				await ctx.parameter('sub', examplePayload.sub);
			}
		);
	});

	test('decodeJWT()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('decodeJWT()');
		await allure.tags(...sharedTags);

		await allure.step('decodes a valid JWT and returns the payload claims', async (ctx) => {
			expect(decodeJWT(exampleToken)).toStrictEqual(examplePayload);
			await ctx.parameter('token', exampleToken);
			await ctx.parameter('expected sub', examplePayload.sub);
			await ctx.parameter('expected name', examplePayload.name);
			await ctx.parameter('expected iat', String(examplePayload.iat));
		});
	});

	test('encodeJWT()', async () => {
		await allure.parentSuite(parentSuiteName);
		await allure.suite(localSuiteName);
		await allure.subSuite('encodeJWT()');
		await allure.tags(...sharedTags);

		await allure.step(
			'encodes header, payload and signature bytes into a JWT string',
			async (ctx) => {
				const headerJSON = '{"alg":"HS256","typ":"JWT"}';
				const payloadJSON = '{"sub":"1234567890","name":"John Doe","iat":1516239022}';
				expect(encodeJWT(headerJSON, payloadJSON, exampleSignature)).toBe(exampleToken);
				await ctx.parameter('headerJSON', headerJSON);
				await ctx.parameter('payloadJSON', payloadJSON);
				await ctx.parameter('expected token', exampleToken);
			}
		);
	});
});
