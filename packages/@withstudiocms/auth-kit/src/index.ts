import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt } from '@withstudiocms/effect/scrypt';
import { AuthKitOptions, type RawAuthKitConfig } from './config.js';
import { Encryption as _Encryption } from './modules/encryption.js';
import { Password as _Password } from './modules/password.js';

export class AuthKit extends Effect.Service<AuthKit>()('@withstudiocms/AuthKit', {
	effect: Effect.gen(function* () {
		const { CMS_ENCRYPTION_KEY, scrypt } = yield* AuthKitOptions;

		/**
		 * Scrypt Effect processor
		 * @private
		 */
		const Scrypt = Effect.gen(function* () {
			const { run } = yield* _Scrypt;
			return { run };
		}).pipe(Effect.provide(_Scrypt.makeLive(scrypt)));

		/**
		 * Encryption utilities
		 */
		const Encryption = _Encryption(CMS_ENCRYPTION_KEY);

		/**
		 * Password management utilities
		 */
		const Password = _Password(Scrypt);

		return {
			Encryption,
			Password,
		} as const;
	}),
}) {
	static makeConfig = (config: RawAuthKitConfig) => AuthKitOptions.Live(config);
}
