import boxen from 'boxen';
import color from 'chalk';
import { detect, resolveCommand } from 'package-manager-detector';
import { exec } from '../../lib/exec.js';
import { askToContinue } from './askToContinue.js';
import { convertPluginsToInstallSpecifiers } from './npm-utils.js';
import { type ClackPrompts, type Logger, type PluginInfo, UpdateResult } from './utils.js';

export async function tryToInstallPlugins({
	plugins,
	cwd,
	logger,
	p,
}: {
	plugins: PluginInfo[];
	cwd?: string;
	logger: Logger;
	p: ClackPrompts;
}): Promise<UpdateResult> {
	const packageManager = await detect({
		cwd,
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	});
	logger.debug(`[add]: package manager: '${packageManager?.name || 'none'}'`);
	if (!packageManager) {
		logger.error(
			'[add]: No package manager detected. Please ensure npm, yarn, pnpm, or another supported package manager is installed.'
		);
		return UpdateResult.none;
	}

	const agent = packageManager?.agent ?? 'npm';
	if (!packageManager?.agent) {
		logger.debug('[add]: No package manager agent detected, falling back to npm');
	}
	const installCommand = resolveCommand(agent, 'add', []);
	if (!installCommand) return UpdateResult.none;

	const installSpecifiers = await convertPluginsToInstallSpecifiers(plugins).then((specifiers) =>
		installCommand.command === 'deno'
			? specifiers.map((specifier) => `npm:${specifier}`) // Deno requires npm prefix to install packages
			: specifiers
	);

	const coloredOutput = `${color.bold(installCommand.command)} ${installCommand.args.join(' ')} ${color.magenta(installSpecifiers.join(' '))}`;

	const message = `\n${boxen(coloredOutput, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
	})}\n`;

	p.note(
		`${color.magenta('StudioCMS will run the following command:')}\n ${color.dim('If you skip this step, you can always run it yourself later')}\n${message}`
	);

	if (await askToContinue(p)) {
		const spinner = p.spinner();
		spinner.start('Installing dependencies...');
		try {
			await exec(installCommand.command, [...installCommand.args, ...installSpecifiers], {
				nodeOptions: {
					cwd,
					env: { NODE_ENV: undefined },
				},
			});
			spinner.stop('Dependencies installed.');
			return UpdateResult.updated;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			spinner.stop('Error installing dependencies');
			logger.debug(`[add]: Error installing dependencies ${err}`);
			// NOTE: `err.stdout` can be an empty string, so log the full error instead for a more helpful log
			console.error('\n', err.stdout || err.message, '\n');
			console.error(
				'\n',
				color.yellow('You may want to try:'),
				'\n',
				'- Checking your network connection\n',
				'- Running the package manager command manually\n',
				'- Ensuring you have permissions to install packages\n'
			);
			return UpdateResult.failure;
		}
	} else {
		return UpdateResult.cancelled;
	}
}
