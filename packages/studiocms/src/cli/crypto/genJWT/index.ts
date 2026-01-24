import fs from 'node:fs';
import { styleText } from 'node:util';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { intro, log, outro, spinner } from '@withstudiocms/effect/clack';
import { SignJWT } from 'jose';
import { importPKCS8 } from 'jose/key/import';
import { Cli, Effect, genLogger } from '../../../effect.js';
import { genContext } from '../../utils/context.js';
import { dateAdd } from '../../utils/dateAdd.js';
import { debug } from '../../utils/debugOpt.js';
import { StudioCMSCliError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

/**
 * One year in seconds
 */
export const OneYear = 31556926;

export const keyFile = Cli.Args.text({ name: 'keyfile' }).pipe(
	Cli.Args.withDescription(
		'a relative path (e.g., `../keys/libsql.pem`) from the current directory to your private key file (.pem)'
	)
);

export const expire = Cli.Options.integer('exp').pipe(
	Cli.Options.withAlias('e'),
	Cli.Options.optional,
	Cli.Options.withDefault(OneYear),
	Cli.Options.withDescription('Expiry date in seconds (>=0) from issued at (iat) time')
);

/**
 * Converts a JWT token to URL-safe base64 format.
 * @param jwtToken - The original JWT token to convert
 * @returns The JWT token in URL-safe base64 format
 */
const convertJwtToBase64Url = (jwtToken: string) =>
	Effect.try(() => Buffer.from(jwtToken).toString('base64url'));

export const genJWT = Cli.Command.make(
	'gen-jwt',
	{ keyFile, expire, debug },
	({ expire, keyFile, debug: _debug }) =>
		genLogger('studiocms/cli/crypto/genJWT')(function* () {
			let exp: number;

			if (typeof expire !== 'number') {
				exp = yield* expire;
			} else {
				exp = Number(expire);
			}

			let debug: boolean;

			if (typeof _debug !== 'boolean') {
				debug = yield* _debug;
			} else {
				debug = _debug;
			}

			if (Number.isNaN(exp)) {
				return yield* new StudioCMSCliError({
					message: `Expiration must be a valid number, received: ${exp}`,
				});
			}

			if (exp < 0) {
				return yield* new StudioCMSCliError({ message: 'Expiration must be greater than 0' });
			}

			if (debug) {
				logger.debug('Debug mode enabled');
				logger.debug(`Key file: ${keyFile}`);
				logger.debug(`Expiration: ${exp}`);
			}

			if (debug) logger.debug('Getting context');

			const context = yield* genContext;

			const { chalk } = context;

			if (debug) logger.debug('Init complete, starting...');

			yield* intro(label('StudioCMS Crypto: Generate JWT', StudioCMSColorwayBg, 'bold'));

			const spin = yield* spinner();

			try {
				yield* spin.start('Getting Key from keyFile');

				if (debug) logger.debug(`Key file path: ${keyFile}`);
				if (debug) logger.debug(`Key file exists: ${fs.existsSync(keyFile)}`);
				if (debug) logger.debug(`Key file is a file: ${fs.statSync(keyFile).isFile()}`);

				// Replace actual newlines with escaped newlines for the JWT generator
				const keyString = yield* Effect.try(() => fs.readFileSync(keyFile, 'utf8'));

				if (debug) logger.debug(`Key string: ${keyString}`);

				if (!keyString) {
					yield* spin.stop('Key not found, or invalid');
					return yield* new StudioCMSCliError({ message: 'Key not found, or invalid' });
				}

				const alg = 'EdDSA';
				let privateKey: CryptoKey;

				try {
					privateKey = yield* Effect.tryPromise(() => importPKCS8(keyString, alg));
				} catch (_e) {
					yield* spin.stop('Invalid or unsupported private key');
					return yield* new StudioCMSCliError({ message: 'Invalid or unsupported private key' });
				}

				const NOW = new Date();
				const expirationDate = yield* dateAdd(NOW, 'second', exp);

				const jwt = yield* Effect.tryPromise(() =>
					new SignJWT({ sub: 'libsql-client' })
						.setProtectedHeader({ alg })
						.setIssuedAt(NOW)
						.setExpirationTime(expirationDate)
						.setIssuer('admin')
						.sign(privateKey)
				);

				const base64UrlJwt = yield* convertJwtToBase64Url(jwt);

				yield* spin.stop('Token Generated.');

				yield* log.success(
					boxen(chalk.bold(`${label('Token Generated!', StudioCMSColorwayInfoBg, 'bold')}`), {
						ln1: 'Your new Token has been generated successfully:',
						ln3: `Token: ${chalk.magenta(jwt)}`,
						ln5: `Base64Url Token: ${chalk.blue(base64UrlJwt)}`,
					})
				);

				yield* outro(
					`${label('You can now use this token where needed.', StudioCMSColorwayBg, 'bold')} Stuck? Join us on Discord at ${StudioCMSColorway(styleText(['bold', 'underline'], 'https://chat.studiocms.dev'))}`
				);
			} catch (err) {
				if (err instanceof Error) {
					if (err.message.includes('ENOENT')) {
						yield* log.error('Key file not found: Please check the file path and try again.');
					} else if (err.message.includes('permission')) {
						yield* log.error('Permission denied: Cannot read the key file.');
					} else {
						yield* log.error(`Error generating JWT: ${err.message}`);
					}
				} else {
					yield* log.error(`Unexpected error generating JWT: ${err}`);
				}
				return yield* new StudioCMSCliError({ message: 'JWT ERROR: Unknown' });
			}
		})
).pipe(Cli.Command.withDescription('Generate a JWT token from a keyfile'));
