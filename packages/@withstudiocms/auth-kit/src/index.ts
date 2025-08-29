import { Effect } from '@withstudiocms/effect';
import { Scrypt as _Scrypt } from '@withstudiocms/effect/scrypt';
import { AuthKitOptions, type RawAuthKitConfig } from './config.js';
import { Encryption as _Encryption } from './modules/encryption.js';
import { Password as _Password } from './modules/password.js';
import { Session as _Session } from './modules/session.js';
import { User as _User } from './modules/user.js';

export class AuthKit extends Effect.Service<AuthKit>()('@withstudiocms/AuthKit', {
	effect: Effect.gen(function* () {
		const { CMS_ENCRYPTION_KEY, scrypt, session, userTools } = yield* AuthKitOptions;

		/**
		 * Scrypt Effect processor
		 * @private
		 */
		const Scrypt = Effect.withSpan('@withstudiocms/AuthKit.Scrypt')(
			Effect.gen(function* () {
				const { run } = yield* _Scrypt;
				return { run };
			}).pipe(Effect.provide(_Scrypt.makeLive(scrypt)))
		);

		/**
		 * Encryption utilities
		 */
		const Encryption = Effect.withSpan('@withstudiocms/AuthKit.Encryption')(
			_Encryption(CMS_ENCRYPTION_KEY)
		);

		/**
		 * Password management utilities
		 */
		const Password = Effect.withSpan('@withstudiocms/AuthKit.Password')(_Password(Scrypt));

		/**
		 * Session management utilities
		 */
		const Session = Effect.withSpan('@withstudiocms/AuthKit.Session')(_Session(session));

		/**
		 * User management utilities
		 */
		const User = Effect.withSpan('@withstudiocms/AuthKit.User')(
			_User({ Scrypt, session, userTools })
		);

		return {
			Encryption,
			Password,
			Session,
			User,
		} as const;
	}),
}) {
	static makeConfig = (config: RawAuthKitConfig) => AuthKitOptions.Live(config);
}
