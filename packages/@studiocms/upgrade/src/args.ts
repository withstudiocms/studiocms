import { Cli } from '@withstudiocms/effect/effect';

/**
 * CLI Argument to specify the version tag to use for package resolution.
 *
 * Defaults to 'latest' if not provided.
 */
export const optVersion = Cli.Args.text({ name: 'version' }).pipe(
	Cli.Args.withDefault('latest'),
	Cli.Args.withDescription(
		'Specific tag to resolve packages against. If not included, will use the latest tag.'
	)
);

/**
 * CLI Argument to enable dry run mode.
 *
 * When enabled, no actual changes will be made.
 */
export const dryRun = Cli.Options.boolean('dry-run').pipe(
	Cli.Options.withDefault(false),
	Cli.Options.withAlias('d'),
	Cli.Options.withDescription('Dry run mode')
);
