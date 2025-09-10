import { Context } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import { describe, expect, it } from 'vitest';
import { AuthKitConfig, AuthKitOptions } from '../src/config.js';

describe('Config Helper', () => {
	it('AuthKitConfig object matches expected shape', async () => {
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
				// @ts-expect-error testing purposefully incorrect type
				session: {
					cookieName: 'auth_session',
					expTime: 1000 * 60 * 60,
				},
			})
		);

		expect(Context.get(Services, AuthKitOptions)).toStrictEqual({
			CMS_ENCRYPTION_KEY: 'test-key',
			scrypt: {
				encryptionKey: 'test-key',
				keylen: 64,
				options: { N: 16384, r: 8, p: 1 },
			},
			session: {
				cookieName: 'auth_session',
				expTime: 1000 * 60 * 60,
			},
		});
	});
});
