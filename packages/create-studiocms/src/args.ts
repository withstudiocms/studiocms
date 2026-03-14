import { Cli } from '@withstudiocms/effect/effect';

/**
 * CLI Argument for specifying the current working directory.
 */
export const cwd = Cli.Options.text('cwd').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('c'),
	Cli.Options.withDescription('Current working directory')
);

/**
 * CLI Argument to enable dry run mode.
 *
 * When enabled, no actual changes will be made.
 */
export const dryRun = Cli.Options.boolean('dry-run').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('d'),
	Cli.Options.withDescription('Dry run mode')
);

/**
 * CLI Argument to skip git initialization.
 *
 * When enabled, a git repository will not be initialized in the new project.
 */
export const doNotInitGit = Cli.Options.boolean('do-not-init-git').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withDescription('Do not initialize a git repository in the new project')
);

/**
 * CLI Argument to skip installing project dependencies.
 *
 * When enabled, project dependencies will not be installed after setup.
 */
export const doNotInstall = Cli.Options.boolean('do-not-install').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withDescription('Do not install project dependencies after setup')
);

/**
 * CLI Argument to enable git initialization.
 *
 * When enabled, a git repository will be initialized in the new project.
 */
export const git = Cli.Options.boolean('git').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('g'),
	Cli.Options.withDescription('Initialize a git repository in the new project')
);

/**
 * CLI Argument to install project dependencies.
 *
 * When enabled, project dependencies will be installed after setup.
 */
export const install = Cli.Options.boolean('install').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('i'),
	Cli.Options.withDescription('Install project dependencies after setup')
);

/**
 * CLI Argument to answer "no" to all prompts.
 *
 * When enabled, all interactive prompts will be answered with "no".
 */
export const no = Cli.Options.boolean('no').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('n'),
	Cli.Options.withDescription('Answer "no" to all prompts')
);

/**
 * CLI Argument to answer "yes" to all prompts.
 *
 * When enabled, all interactive prompts will be answered with "yes".
 */
export const yes = Cli.Options.boolean('yes').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('y'),
	Cli.Options.withDescription('Answer "yes" to all prompts')
);

/**
 * CLI Argument for specifying the project name.
 */
export const projectName = Cli.Options.text('project-name').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('p'),
	Cli.Options.withDescription('Name of the project to create')
);

/**
 * CLI Argument to skip displaying banners.
 *
 * When enabled, banners will not be displayed during the setup process.
 */
export const skipBanners = Cli.Options.boolean('skip-banners').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('quiet'),
	Cli.Options.withDescription('Skip displaying banners during the setup process')
);

/**
 * CLI Argument for specifying the project template.
 */
export const template = Cli.Options.text('template').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('t'),
	Cli.Options.withDescription('Project template to use')
);

/**
 * CLI Argument for specifying the template reference.
 */
export const templateRef = Cli.Options.text('template-ref').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withAlias('r'),
	Cli.Options.withDescription('Specific branch, tag, or commit of the template to use')
);

/**
 * CLI Argument to enable debug mode.
 *
 * When enabled, more verbose logging will be provided.
 */
export const debug = Cli.Options.boolean('debug').pipe(
	Cli.Options.withDefault(undefined),
	Cli.Options.withDescription('Enable debug mode for more verbose logging')
);

/**
 * Combined CLI Command Configuration
 */
export const CommandConfig = {
	cwd,
	dryRun,
	doNotInitGit,
	git,
	install,
	no,
	yes,
	projectName,
	skipBanners,
	template,
	templateRef,
	debug,
	doNotInstall,
};
