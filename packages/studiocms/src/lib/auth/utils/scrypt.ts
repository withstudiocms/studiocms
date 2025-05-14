import { type ScryptOptions, scrypt } from 'node:crypto';
import { CMS_ENCRYPTION_KEY } from 'astro:env/server';
import { Brand, Context, Data, Effect, Layer } from 'effect';
import { errorTap, genLogger, pipeLogger } from '../../effects/index.js';

const SCRYPT_N = Math.max(16384, Number.parseInt(process.env.SCRYPT_N || '16384', 10));
const SCRYPT_R = Math.max(8, Number.parseInt(process.env.SCRYPT_R || '8', 10));
const SCRYPT_P = Math.max(1, Number.parseInt(process.env.SCRYPT_P || '1', 10));

export class ScryptError extends Data.TaggedError('ScryptError')<{ error: Error }> {}

type ScryptConfigOptions = {
	salt: string;
	keylen: number;
	options: ScryptOptions;
} & Brand.Brand<'ScryptConfigOptions'>;

const ScryptConfigOptions = Brand.nominal<ScryptConfigOptions>();

export class ScryptConfig extends Context.Tag('studiocms/lib/auth/utils/scrypt/ScryptConfig')<
	ScryptConfig,
	ScryptConfigOptions
>() {
	static Layer = Layer.succeed(
		this,
		this.of(
			ScryptConfigOptions({
				salt: CMS_ENCRYPTION_KEY,
				keylen: 64,
				options: {
					N: SCRYPT_N,
					r: SCRYPT_R,
					p: SCRYPT_P,
				},
			})
		)
	);
}

export class Scrypt extends Effect.Service<Scrypt>()('studiocms/lib/auth/utils/scrypt/Scrypt', {
	effect: genLogger('studiocms/lib/auth/utils/scrypt/Scrypt.effect')(function* () {
		const { salt, keylen, options } = yield* ScryptConfig;
		return (password: string) =>
			pipeLogger('studiocms/lib/auth/utils/scrypt/Scrypt.Default')(
				Effect.async<Buffer<ArrayBufferLike>, ScryptError>((resume) => {
					scrypt(password, salt, keylen, options, (error, derivedKey) => {
						if (error) {
							const toFail = new ScryptError({ error });
							resume(errorTap(Effect.fail(toFail), toFail));
						} else {
							resume(Effect.succeed(derivedKey));
						}
					});
				})
			);
	}),
	dependencies: [ScryptConfig.Layer],
}) {}
