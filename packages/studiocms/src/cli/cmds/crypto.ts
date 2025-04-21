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
import { OneYear } from './crypto/consts.js';
import { generator } from './crypto/generator.js';

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
	.option('-c, --claim <claim...>', 'claim in the form [key=value]')
	.option('-e, --exp <date-in-seconds>', 'Expiry date in seconds (>=0) from issued at (iat) time')
	.addOption(new Option('--debug', 'Enable debug mode.').hideHelp(true))
	.hook('preAction', (thisCommand) => {
		const options = thisCommand.opts();
		if (options.claim) {
			const invalidClaims = options.claim.filter((c: string) => !c.includes('='));
			if (invalidClaims.length > 0) {
				console.error(
					`Invalid claim format: ${invalidClaims.join(', ')} - claims must be in format key=value`
				);
				process.exit(1);
			}
		}

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
	.action(async (keyFile, { claim, exp: maybeExp, debug }) => {
		if (debug) {
			console.log('Debug mode enabled');
			console.log('Key file:', keyFile);
			console.log('Claim:', claim);
			console.log('Expiration:', maybeExp);
		}

		if (debug) console.log('Getting context');
		const context = await getBaseContext({});
		prompts.intro(label('StudioCMS Crypto: Generate JWT', StudioCMSColorwayBg, context.c.bold));

		const spinner = prompts.spinner();

		try {
			spinner.start('Getting Key from keyFile');

			if (debug) console.log('Key file path:', keyFile);

			// Replace actual newlines with escaped newlines for the JWT generator
			const keyString = fs.readFileSync(keyFile, 'utf8').split(/\r?\n/).join('\\n');

			if (debug) console.log('Key string:', keyString);

			if (!keyString) {
				spinner.stop('Key not found, or invalid');
				process.exit(1);
			}

			// Validate key format (check for a basic PEM format)
			if (!keyString.includes('-----BEGIN') || !keyString.includes('-----END')) {
				spinner.stop('Invalid key format. Please provide a valid PEM file');
				process.exit(1);
			}

			if (debug) console.log('Key string validated');

			spinner.message('Key Found. Getting Expire Date.');

			const exp = maybeExp ? Number.parseInt(maybeExp) : OneYear;

			if (debug) console.log('Expiration:', exp);

			spinner.message('Expire Date set.  Generating Token.');

			const safeToken = generator(keyString, claim, exp);

			if (!safeToken) {
				spinner.stop(
					'Token generation failed. Please check the key file, claim structure, and parameters.'
				);
				process.exit(1);
			}

			spinner.stop('Token Generated.');

			prompts.log.success(
				boxen(
					context.c.bold(`${label('Token Generated!', StudioCMSColorwayInfoBg, context.c.bold)}`),
					{
						ln2: 'Your new Token has been generated successfully:',
						ln3: context.c.magenta(safeToken),
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
