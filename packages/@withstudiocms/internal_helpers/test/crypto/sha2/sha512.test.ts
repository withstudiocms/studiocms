import { expect, test } from 'vitest';
import { SHA512, sha512 } from '../../../src/crypto/sha2/sha512.js';

test('SHA512_256', async () => {
	const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
	for (let i = 0; i < randomValues.byteLength / 5; i++) {
		const expected = sha512(randomValues.slice(0, i * 5));
		const hash = new SHA512();
		for (let j = 0; j < i; j++) {
			hash.update(randomValues.slice(j * 5, (j + 1) * 5));
		}
		expect(hash.digest()).toStrictEqual(expected);
	}
});
