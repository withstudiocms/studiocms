import { expect, test } from 'vitest';
import { SHAKE128, SHAKE256, shake128, shake256 } from '../../../src/crypto/sha3/xof.js';

test('SHAKE128', async () => {
	const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
	for (let i = 0; i < randomValues.byteLength / 5; i++) {
		const expected = shake128(i + 1, randomValues.slice(0, i * 5));
		const hash = new SHAKE128(i + 1);
		for (let j = 0; j < i; j++) {
			hash.update(randomValues.slice(j * 5, (j + 1) * 5));
		}
		expect(hash.digest()).toStrictEqual(expected);
	}
});

test('SHAKE256', async () => {
	const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
	for (let i = 0; i < randomValues.byteLength / 5; i++) {
		const expected = shake256(i + 1, randomValues.slice(0, i * 5));
		const hash = new SHAKE256(i + 1);
		for (let j = 0; j < i; j++) {
			hash.update(randomValues.slice(j * 5, (j + 1) * 5));
		}
		expect(hash.digest()).toStrictEqual(expected);
	}
});
