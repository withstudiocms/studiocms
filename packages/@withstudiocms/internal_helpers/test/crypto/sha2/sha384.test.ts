import { expect, test } from 'vitest';
import { SHA384, sha384 } from '../../../src/crypto/sha2/sha384.js';

test('SHA384', async () => {
	const randomValues = crypto.getRandomValues(new Uint8Array(5 * 100));
	for (let i = 0; i < randomValues.byteLength / 5; i++) {
		const expected = sha384(randomValues.slice(0, i * 5));
		const hash = new SHA384();
		for (let j = 0; j < i; j++) {
			hash.update(randomValues.slice(j * 5, (j + 1) * 5));
		}
		expect(hash.digest()).toStrictEqual(expected);
	}
});
