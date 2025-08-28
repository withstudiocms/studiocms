import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Context } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { AuthKitConfig, AuthKitOptions } from '../dist/config.js';

describe('Config Helper', () => {
	test('AuthKitOptions.Live returns a Layer with correct config', async () => {
		const CMS_ENCRYPTION_KEY = 'test-key';

		const Services = Context.make(
			AuthKitOptions,
			AuthKitConfig({
				CMS_ENCRYPTION_KEY,
				scrypt: ScryptConfigOptions({
					encryptionKey: CMS_ENCRYPTION_KEY,
					keylen: 64,
					options: { N: 16384, r: 8, p: 1 },
				}),
				session: {
					cookieName: 'auth_session',
					expTime: 1000 * 60 * 60, // 1 hour
				},
			})
		);

		assert.deepStrictEqual(Context.get(Services, AuthKitOptions), {
			CMS_ENCRYPTION_KEY: 'test-key',
			scrypt: {
				encryptionKey: 'test-key',
				keylen: 64,
				options: { N: 16384, r: 8, p: 1 },
			},
			session: {
				cookieName: 'auth_session',
				expTime: 1000 * 60 * 60, // 1 hour
			},
		});
	});
});
