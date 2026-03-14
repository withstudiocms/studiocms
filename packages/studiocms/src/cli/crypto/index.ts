import { Cli } from '../../effect.js';
import { genJWT } from './genJWT/index.js';

export const cryptoCMD = Cli.Command.make('crypto').pipe(
	Cli.Command.withDescription('Crypto Utilities for StudioCMS Security'),
	Cli.Command.withSubcommands([genJWT])
);
