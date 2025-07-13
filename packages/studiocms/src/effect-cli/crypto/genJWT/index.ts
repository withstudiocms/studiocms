import fs from 'node:fs';
import { Args, Command, Options } from '@effect/cli';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { boxen, label } from '@withstudiocms/cli-kit/messages';
import { SignJWT } from 'jose';
import { importPKCS8 } from 'jose/key/import';
import { Console, Effect, genLogger } from '../../../effect.js';
import { genContext } from '../../utils/context.js';
import { dateAdd } from '../../utils/dateAdd.js';
import { logger } from '../../utils/logger.js';

/**
 * One year in seconds
 */
export const OneYear = 31556926;

export const keyFile = Args.text({ name: 'keyfile' }).pipe(
	Args.withDescription(
		'a relative path (e.g., `../keys/libsql.pem`) from the current directory to your private key file (.pem)'
	)
);

export const expire = Options.integer('exp').pipe(
	Options.withAlias('e'),
	Options.optional,
	Options.withDefault(OneYear),
	Options.withDescription('Expiry date in seconds (>=0) from issued at (iat) time')
);

export const debug = Options.boolean('debug').pipe(
	Options.optional,
	Options.withDefault(false),
	Options.withDescription('Enable debug mode')
);

/**
 * Converts a JWT token to URL-safe base64 format.
 * @param jwtToken - The original JWT token to convert
 * @returns The JWT token in URL-safe base64 format
 */
const convertJwtToBase64Url = (jwtToken: string) =>
	Effect.try(() => Buffer.from(jwtToken).toString('base64url'));

export const genJWT = Command.make(
	'gen-jwt',
	{ keyFile, expire, debug },
	({ expire, keyFile, debug }) =>
		genLogger('studiocms/cli/crypto')(function* () {
			const exp = Number(expire);

			if (Number.isNaN(exp)) {
				yield* Console.error('Expiration must be a valid number, received: ', exp);
				process.exit(1);
			}

			if (exp < 0) {
				yield* Console.error('Expiration must be greater than 0');
				process.exit(1);
			}

			if (debug) {
				logger.debug('Debug mode enabled');
				logger.debug(`Key file: ${keyFile}`);
				logger.debug(`Expiration: ${exp}`);
			}

			if (debug) logger.debug('Getting context');

			const context = yield* genContext;

			const { prompts, chalk } = context;

			if (debug) logger.debug('Init complete, starting...');

			prompts.intro(label('StudioCMS Crypto: Generate JWT', StudioCMSColorwayBg, chalk.bold));

			const spinner = prompts.spinner();

			try {
				spinner.start('Getting Key from keyFile');

				if (debug) logger.debug(`Key file path: ${keyFile}`);
				if (debug) logger.debug(`Key file exists: ${fs.existsSync(keyFile)}`);
				if (debug) logger.debug(`Key file is a file: ${fs.statSync(keyFile).isFile()}`);

				// Replace actual newlines with escaped newlines for the JWT generator
				const keyString = yield* Effect.try(() => fs.readFileSync(keyFile, 'utf8'));

				if (debug) logger.debug(`Key string: ${keyString}`);

				if (!keyString) {
					spinner.stop('Key not found, or invalid');
					process.exit(1);
				}

				const alg = 'EdDSA';
				let privateKey: CryptoKey;

				try {
					privateKey = yield* Effect.tryPromise(() => importPKCS8(keyString, alg));
				} catch (e) {
					spinner.stop('Invalid or unsupported private key');
					process.exit(1);
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

				spinner.stop('Token Generated.');

				prompts.log.success(
					boxen(chalk.bold(`${label('Token Generated!', StudioCMSColorwayInfoBg, chalk.bold)}`), {
						ln1: 'Your new Token has been generated successfully:',
						ln3: `Token: ${chalk.magenta(jwt)}`,
						ln5: `Base64Url Token: ${chalk.blue(base64UrlJwt)}`,
					})
				);

				prompts.outro(
					`${label('You can now use this token where needed.', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
				);
			} catch (err) {
				if (err instanceof Error) {
					if (err.message.includes('ENOENT')) {
						prompts.log.error('Key file not found: Please check the file path and try again.');
					} else if (err.message.includes('permission')) {
						prompts.log.error('Permission denied: Cannot read the key file.');
					} else {
						prompts.log.error(`Error generating JWT: ${err.message}`);
					}
				} else {
					prompts.log.error(`Unexpected error generating JWT: ${err}`);
				}
				process.exit(1);
			}
		})
).pipe(Command.withDescription('Generate a JWT token from a keyfile'));
