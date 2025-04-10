import boxen from 'boxen';
import color from 'chalk';
import { detect, resolveCommand } from 'package-manager-detector';
import yoctoSpinner from 'yocto-spinner';
import { exec } from '../../lib/exec.js';
import { askToContinue } from './askToContinue.js';
import { convertIntegrationsToInstallSpecifiers } from './npm-utils.js';
import { type Logger, type PluginInfo, UpdateResult } from './utils.js';

export async function tryToInstallPlugins({
	plugins,
	cwd,
	logger,
}: {
	plugins: PluginInfo[];
	cwd?: string;
	logger: Logger;
}): Promise<UpdateResult> {
	const packageManager = await detect({
		cwd,
		// Include the `install-metadata` strategy to have the package manager that's
		// used for installation take precedence
		strategies: ['install-metadata', 'lockfile', 'packageManager-field'],
	});
	logger.debug(`[add]: package manager: '${packageManager?.name}'`);
	if (!packageManager) return UpdateResult.none;

	const installCommand = resolveCommand(packageManager?.agent ?? 'npm', 'add', []);
	if (!installCommand) return UpdateResult.none;

	const installSpecifiers = await convertIntegrationsToInstallSpecifiers(plugins).then(
		(specifiers) =>
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

	logger.log(
		`${color.magenta('StudioCMS will run the following command:')}\n ${color.dim('If you skip this step, you can always run it yourself later')}\n${message}`
	);

	if (await askToContinue()) {
		const spinner = yoctoSpinner({
			text: 'Installing dependencies...',
		}).start();
		try {
			await exec(installCommand.command, [...installCommand.args, ...installSpecifiers], {
				nodeOptions: {
					cwd,
					env: { NODE_ENV: undefined },
				},
			});
			spinner.success();
			return UpdateResult.updated;
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			spinner.error();
			logger.debug(`[add]: Error installing dependencies ${err}`);
			// NOTE: `err.stdout` can be an empty string, so log the full error instead for a more helpful log
			console.error('\n', err.stdout || err.message, '\n');
			return UpdateResult.failure;
		}
	} else {
		return UpdateResult.cancelled;
	}
}
