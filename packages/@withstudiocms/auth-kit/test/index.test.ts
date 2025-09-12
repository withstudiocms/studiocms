import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt, ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { describe, expect, it, vi } from 'vitest';
import { PasswordModConfigFinal } from '../src/config.js';
import { makeScrypt } from '../src/index.js';

// Generate a 16-byte base64 key for AES-128-GCM
const keyBytes = new Uint8Array(16);
for (let i = 0; i < 16; i++) keyBytes[i] = i + 1;
const CMS_ENCRYPTION_KEY = Buffer.from(keyBytes).toString('base64');

describe('makeScrypt', () => {
	const validConfig = PasswordModConfigFinal({
		scrypt: ScryptConfigOptions({
			encryptionKey: CMS_ENCRYPTION_KEY,
			keylen: 64,
			options: { N: 16384, r: 8, p: 1 },
		}),
	});

	it('returns an object with a run method when given valid config', async () => {
		const effect = makeScrypt(validConfig);
		const scryptInstance = await Effect.runPromise(effect);
		const result = await Effect.runPromise(scryptInstance);

		expect(result).toHaveProperty('run');
		expect(typeof result.run).toBe('function');

		const testhash = (await Effect.runPromise(result.run('testpassword'))).toString('hex');

		console.log(testhash);

		expect(typeof testhash).toBe('string');
		expect(testhash).toMatch(/[a-f0-9]+$/);
	});

	it('returns an error if _Scrypt.makeLive throws', async () => {
		vi.spyOn(_Scrypt, 'makeLive').mockImplementation(() => {
			throw new Error('scrypt config error');
		});

		const effect = makeScrypt(validConfig);
		await expect(Effect.runPromise(effect)).rejects.toThrow(
			/Failed to create Scrypt instance: scrypt config error/
		);
	});
});
