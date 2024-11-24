const pkgManagers = ['npm', 'yarn', 'pnpm', 'bun'] as const;

const defaultPkgManagers: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun'];

const commands: Commands = {
	npm: {
		add: 'npm i',
		create: 'npm create',
		devOption: '-D',
		exec: 'npx',
		run: 'npm run',
		remove: 'npm uninstall',
	},
	yarn: {
		add: 'yarn add',
		create: 'yarn create',
		devOption: '-D',
		exec: 'yarn',
		run: 'yarn run',
		remove: 'yarn remove',
	},
	pnpm: {
		add: 'pnpm add',
		create: 'pnpm create',
		devOption: '-D',
		exec: 'pnpm',
		run: 'pnpm run',
		remove: 'pnpm remove',
	},
	bun: {
		add: 'bun add',
		create: 'bun create',
		devOption: '-D',
		exec: 'bunx',
		run: 'bun',
		remove: 'bun remove',
	},
};

const icons: Record<PackageManager, string | undefined> = {
	npm: 'seti:npm',
	yarn: 'seti:yarn',
	pnpm: 'pnpm',
	bun: 'bun',
};

export function getSupportedPkgManagers(
	type: CommandType,
	userPkgManagers: PackageManager[] | undefined
) {
	return (userPkgManagers ?? defaultPkgManagers).filter(
		(pkgManager) => commands[pkgManager][type] !== undefined
	);
}

export function getIcon(pkgManager: PackageManager) {
	return icons[pkgManager];
}

export function getCommand(
	pkgManager: PackageManager,
	type: CommandType,
	pkg: string | undefined,
	options: CommandOptions
) {
	let command = commands[pkgManager][type];

	if (!command) {
		throw new Error(`Command type '${type}' is not supported for package manager '${pkgManager}'.`);
	}

	if (options.prefix) {
		command = `${options.prefix} ${command}`;
	}

	if (options.comment) {
		command = `# ${options.comment.replaceAll('{PKG}', pkgManager)}\n${command}`;
	}

	if (type === 'add' && options.dev) {
		command += ` ${commands[pkgManager].devOption}`;
	}

	if (pkg) {
		command += ` ${pkg}`;
	}

	if (options.args && options.args.length > 0) {
		if (pkgManager === 'npm' && type !== 'exec' && type !== 'run') {
			command += ' --';
		}

		command += ` ${options.args}`;
	}

	return command;
}

export type CommandType = 'add' | 'create' | 'exec' | 'run' | 'remove';

export interface CommandOptions {
	args?: string;
	comment?: string;
	dev?: boolean;
	prefix?: string;
}

type Commands = Record<
	PackageManager,
	Record<Exclude<CommandType, 'create'> | 'devOption', string> & { create?: string }
>;

export type PackageManager = (typeof pkgManagers)[number];
