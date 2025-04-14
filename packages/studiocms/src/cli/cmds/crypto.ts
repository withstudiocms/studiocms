import fs from 'node:fs';
import * as prompts from '@clack/prompts';
import { Command, Option } from '@commander-js/extra-typings';
import chalk from 'chalk';
import {
	CLITitle,
	StudioCMSColorway,
	StudioCMSColorwayBg,
	StudioCMSColorwayInfoBg,
	boxen,
	label,
} from '../lib/utils';
import { generator } from './crypto/generator';

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
	.argument('<key-file>', 'Path your your private key file (.pem)')
	.description('Generate a JWT token from a keyfile')
	.summary('Generate JWT token from a keyfile')
	.option('-c, --claim <claim...>', 'claim in the form [key=value]')
	.option('-e, --exp <date-in-seconds>', 'expiry date in seconds from issued at (iat) time')
	.action(async (keyFile, { claim, exp: maybeExp }) => {
		prompts.intro(label('StudioCMS Crypto: Generate JWT', StudioCMSColorwayBg, chalk.black));

		const spinner = prompts.spinner();

		try {
			spinner.start('Getting Key from keyFile');

			const keyFilePath = new URL(keyFile, process.cwd());

			const keyString = fs.readFileSync(keyFilePath, 'utf8').split(/\r?\n/).join('\\n');

			if (!keyString) {
				spinner.stop('Key not found, or invalid');
				process.exit(1);
			}

			spinner.message('Key Found. Getting Expire Date.');

			const exp: number = maybeExp ? Number.parseInt(maybeExp) : 31556926;

			spinner.message('Expire Date set.  Generating Token.');

			const safeToken = generator(keyString, claim, exp);

			if (!safeToken) {
				spinner.stop('Unable to generate token, please check logs and try again.');
				process.exit(1);
			}

			spinner.stop('Token Generated.');

			prompts.log.success(
				boxen(chalk.bold(`${label('Token Generated!', StudioCMSColorwayInfoBg, chalk.bold)}`), {
					ln2: 'Your new Token has been generated successfully:',
					ln3: chalk.magenta(safeToken),
				})
			);

			prompts.outro(
				`${label('You can now use this token where needed.', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
			);
		} catch (err) {
			prompts.log.error(`There was an Error generating your JWT: ${(err as Error).message}`);
			process.exit(1);
		}
	});

await program.parseAsync();
