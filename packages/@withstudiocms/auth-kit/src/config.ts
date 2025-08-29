import { Brand, Context, Layer } from '@withstudiocms/effect';
import { ScryptConfigOptions } from '@withstudiocms/effect/scrypt';
import type { SessionConfig, UserTools } from './types.js';
import { defaultSessionConfig } from './utils/session.js';

export type RawAuthKitConfig = {
	CMS_ENCRYPTION_KEY: string;
	session: Required<SessionConfig>;
	userTools: UserTools;
};

export type AuthKitConfig = {
	CMS_ENCRYPTION_KEY: string;
	scrypt: ScryptConfigOptions;
	session: Required<SessionConfig>;
	userTools: UserTools;
} & Brand.Brand<'AuthKitConfig'>;

export const AuthKitConfig = Brand.nominal<AuthKitConfig>();

export class AuthKitOptions extends Context.Tag('AuthKitOptions')<AuthKitOptions, AuthKitConfig>() {
	static Live = ({ CMS_ENCRYPTION_KEY, session: _session, userTools }: RawAuthKitConfig) => {
		// Scrypt parameters
		const parsedN = Number.parseInt(process.env.SCRYPT_N ?? '', 10);
		const SCRYPT_N = Number.isFinite(parsedN) ? Math.max(16384, parsedN) : 16384;
		const parsedR = Number.parseInt(process.env.SCRYPT_R ?? '', 10);
		const SCRYPT_R = Number.isFinite(parsedR) ? Math.max(8, parsedR) : 8;
		const parsedP = Number.parseInt(process.env.SCRYPT_P ?? '', 10);
		const SCRYPT_P = Number.isFinite(parsedP) ? Math.max(1, parsedP) : 1;

		const scrypt = ScryptConfigOptions({
			encryptionKey: CMS_ENCRYPTION_KEY,
			keylen: 64,
			options: {
				N: SCRYPT_N,
				r: SCRYPT_R,
				p: SCRYPT_P,
			},
		});

		const session = {
			...defaultSessionConfig,
			..._session,
		};

		return Layer.succeed(
			this,
			this.of(AuthKitConfig({ CMS_ENCRYPTION_KEY, scrypt, session, userTools }))
		);
	};
}
