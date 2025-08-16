import { type BinaryLike, type ScryptOptions, scrypt } from 'node:crypto';
import { Brand, Context, Data, Effect, Layer } from './effect.js';

/**
 * Represents an error specific to the Scrypt operation.
 *
 * This class extends a tagged error to provide additional context
 * about errors that occur during Scrypt-related operations.
 *
 * @extends Data.TaggedError
 * @template { error: Error } - The shape of the additional error context.
 */
export class ScryptError extends Data.TaggedError('ScryptError')<{ error: Error }> {}

/**
 * Configuration options for the Scrypt key derivation function.
 *
 * @remarks
 * This type is branded to ensure type safety and prevent accidental misuse.
 *
 * @property encryptionKey - The secret key used for encryption.
 * @property keylen - The desired length of the derived key in bytes.
 * @property options - Additional options for the Scrypt algorithm.
 */
export type ScryptConfigOptions = {
	encryptionKey: BinaryLike;
	keylen: number;
	options: ScryptOptions;
} & Brand.Brand<'ScryptConfigOptions'>;

/**
 * Represents the configuration options for the Scrypt algorithm.
 * This is a nominal type to ensure type safety when working with Scrypt configurations.
 *
 * @remarks
 * The `Brand.nominal` utility is used to create a unique type that cannot be
 * accidentally substituted with other types, even if they have the same structure.
 *
 * @example
 * ```typescript
 * const config: ScryptConfigOptions = {
 *   encryptionKey: 'my-secret-key',
 *   keylen: 64,
 *   options: { N: 16384, r: 8, p: 1 },
 * };
 * ```
 */
export const ScryptConfigOptions = Brand.nominal<ScryptConfigOptions>();

/**
 * Context for Scrypt configuration.
 *
 * This context holds the Scrypt configuration options and provides a way to access them
 * throughout the application.
 *
 * @extends Context.Tag
 * @template {ScryptConfig} - The type of the context.
 */
export class ScryptConfig extends Context.Tag('ScryptConfig')<ScryptConfig, ScryptConfigOptions>() {
	static Make = (opts: ScryptConfigOptions) => Layer.succeed(this, ScryptConfigOptions(opts));
}

/**
 * Scrypt service for key derivation.
 *
 * This service provides methods to derive keys using the Scrypt algorithm.
 * It uses the configuration provided by the ScryptConfig context.
 *
 * @extends Effect.Service
 * @template {Scrypt} - The type of the service.
 */
export class Scrypt extends Effect.Service<Scrypt>()('Scrypt', {
	effect: Effect.gen(function* () {
		const config = yield* ScryptConfig;

		const run = (password: BinaryLike) =>
			Effect.async<Buffer, ScryptError>((resume) => {
				scrypt(password, config.encryptionKey, config.keylen, config.options, (err, derivedKey) => {
					if (err) {
						resume(Effect.fail(new ScryptError({ error: err })));
					} else {
						resume(Effect.succeed(derivedKey));
					}
				});
			});

		return {
			run,
		};
	}),
}) {
	/**
	 * This is used to create a configuration layer for the Scrypt service.
	 */
	static makeConfig = (opts: ScryptConfigOptions) => ScryptConfig.Make(opts);

	/**
	 * Creates a live instance of the Scrypt service with the specified configuration options.
	 *
	 * @param opts - The configuration options for the Scrypt service.
	 * @returns Layer that provides the Scrypt service with the specified configuration.
	 */
	static makeLive = (opts: ScryptConfigOptions) =>
		Layer.provide(this.Default, this.makeConfig(opts));
}
