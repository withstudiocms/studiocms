import fs from 'node:fs';
import * as prompts from '@clack/prompts';
import {
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
} from '@withstudiocms/cli-kit/colors';
import { Command, Option } from '@withstudiocms/cli-kit/commander';
import { getBaseContext } from '@withstudiocms/cli-kit/context';
import { CLITitle, boxen, label } from '@withstudiocms/cli-kit/messages';
import { SignJWT } from 'jose';
import { importPKCS8 } from 'jose/key/import';
import { dateAdd } from '../lib/dateAdd.js';
import { logger } from '../lib/utils.js';
import { OneYear } from './crypto/consts.js';

/**
 * Converts a JWT token to URL-safe base64 format.
 * @param jwtToken - The original JWT token to convert
 * @returns The JWT token in URL-safe base64 format
 */
const convertJwtToBase64Url = (jwtToken: string): string =>
	Buffer.from(jwtToken).toString('base64url');

const program = new Command('crypto')
	.description('Crypto Utilities for Security')
	.summary('Crypto Utilities for Security')
	.addHelpText('beforeAll', CLITitle)
	.showHelpAfterError('(add --help for additional information)')
	.helpOption('-h, --help', 'Display help for command.')
	.action(function () {
		this.help();
	});

program
	.command('gen-jwt')
	.argument(
		'<key-file>',
		'a relative path (e.g., `../keys/libsql.pem`) from the current directory to your private key file (.pem)'
	)
	.description('Generate a JWT token from a keyfile')
	.summary('Generate JWT token from a keyfile')
	.option('-e, --exp <date-in-seconds>', 'Expiry date in seconds (>=0) from issued at (iat) time')
	.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
	.hook('preAction', (thisCommand) => {
		const options = thisCommand.opts();

		const exp = options.exp ? Number.parseInt(options.exp) : OneYear;

		if (Number.isNaN(exp)) {
			console.error('Expiration must be a valid number');
			process.exit(1);
		}

		if (exp < 0) {
			console.error('Expiration must be greater than 0');
			process.exit(1);
		}
	})
	.action(async (keyFile, { exp: maybeExp, debug }) => {
		if (debug) {
			logger.debug('Debug mode enabled');
			logger.debug(`Key file: ${keyFile}`);
			logger.debug(`Expiration: ${maybeExp}`);
		}

		if (debug) logger.debug('Getting context');

		const context = await getBaseContext({});
		prompts.intro(label('StudioCMS Crypto: Generate JWT', StudioCMSColorwayBg, context.c.bold));

		const spinner = prompts.spinner();

		try {
			spinner.start('Getting Key from keyFile');

			if (debug) logger.debug(`Key file path: ${keyFile}`);
			if (debug) logger.debug(`Key file exists: ${fs.existsSync(keyFile)}`);
			if (debug) logger.debug(`Key file is a file: ${fs.statSync(keyFile).isFile()}`);

			// Replace actual newlines with escaped newlines for the JWT generator
			const keyString = fs.readFileSync(keyFile, 'utf8').split(/\r?\n/).join('\\n');

			if (debug) logger.debug(`Key string: ${keyString}`);

			if (!keyString) {
				spinner.stop('Key not found, or invalid');
				process.exit(1);
			}

			const alg = 'EdDSA';

			const privateKey = await importPKCS8(keyString, alg);

			spinner.message('Key Found. Getting Expire Date.');

			const exp = maybeExp ? Number.parseInt(maybeExp) : OneYear;

			if (debug) logger.debug(`Expiration: ${exp}`);

			spinner.message('Expire Date set.  Generating Token.');

			const NOW = new Date();
			const expirationDate = dateAdd(NOW, 'second', exp);

			const jwt = await new SignJWT({ sub: 'libsql-client' })
				.setProtectedHeader({ alg })
				.setIssuedAt(NOW)
				.setExpirationTime(expirationDate)
				.setIssuer('admin')
				.sign(privateKey);

			const base64UrlJwt = convertJwtToBase64Url(jwt);

			spinner.stop('Token Generated.');

			prompts.log.success(
				boxen(
					context.c.bold(`${label('Token Generated!', StudioCMSColorwayInfoBg, context.c.bold)}`),
					{
						ln1: 'Your new Token has been generated successfully:',
						ln3: `Token: ${context.c.magenta(jwt)}`,
						ln5: `Base64Url Token: ${context.c.blue(base64UrlJwt)}`,
					}
				)
			);

			prompts.outro(
				`${label('You can now use this token where needed.', StudioCMSColorwayBg, context.c.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
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
	});

await program.parseAsync();
