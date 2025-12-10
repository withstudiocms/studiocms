import { Cli } from '@withstudiocms/effect';

/**
 * CLI option to enable debug mode.
 */
export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.optional,
	Cli.Options.withDefault(false),
	Cli.Options.withDescription('Enable debug mode')
);
