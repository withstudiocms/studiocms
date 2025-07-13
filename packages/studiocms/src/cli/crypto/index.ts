import { Command } from '@effect/cli';
import { genJWT } from './genJWT/index.js';

export const cryptoCMD = Command.make('crypto').pipe(
	Command.withDescription('Crypto Utilities for StudioCMS Security'),
	Command.withSubcommands([genJWT])
);
