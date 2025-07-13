import os from 'node:os';
import * as p from '@clack/prompts';
import { cancelMessage, getName } from '@withstudiocms/cli-kit/messages';
import { readJson } from '@withstudiocms/cli-kit/utils';
import colors from 'chalk';
import getSeasonalMessages from '../../effect-cli/utils/seasonal.js';
import { logger } from './utils.js';

const pkgJson = readJson<{ version: string }>(new URL('../../../package.json', import.meta.url));

interface BaseContext {
	p: typeof p;
	c: typeof colors;
	pCancel(val: symbol): void;
	pOnCancel(): void;
	cwd: string;
	packageManager: string;
	username: string;
	version: string;
	exit(code: number): never;
	tasks: p.Task[];
	logger: typeof logger;
	welcome: string;
}

interface InteractiveOptions {
	dryRun?: boolean;
	skipBanners?: boolean;
	debug?: boolean;
}

export interface Context extends BaseContext, InteractiveOptions {}

export async function getContext(args: InteractiveOptions): Promise<Context> {
	let { debug, dryRun, skipBanners } = args;

	const packageManager = detectPackageManager() ?? 'npm';
	const cwd = process.cwd();

	const { messages } = getSeasonalMessages();

	skipBanners = !!((os.platform() === 'win32' || skipBanners) && !process.env.CI);

	const context: Context = {
		p: p,
		c: colors,
		pCancel(val: symbol) {
			p.isCancel(val);
			p.cancel(cancelMessage);
			process.exit(0);
		},
		pOnCancel() {
			p.cancel(cancelMessage);
			process.exit(0);
		},
		packageManager,
		username: await getName(),
		version: pkgJson.version,
		welcome: random(messages),
		dryRun,
		debug,
		cwd,
		skipBanners,
		exit(code) {
			process.exit(code);
		},
		tasks: [],
		logger: logger,
	};

	return context;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const random = (...arr: any[]) => {
	const flattenedArray = arr.flat(1);
	return flattenedArray[Math.floor(flattenedArray.length * Math.random())];
};

export function detectPackageManager() {
	if (!process.env.npm_config_user_agent) return;
	const specifier = process.env.npm_config_user_agent.split(' ')[0];
	const name = specifier.substring(0, specifier.lastIndexOf('/'));
	return name === 'npminstall' ? 'cnpm' : name;
}
