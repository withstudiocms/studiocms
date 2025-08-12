import { readJson } from '@withstudiocms/cli-kit/utils';
import { Cli, Effect, Layer, PlatformNode } from '../effect.js';
import { addPlugin } from './add/index.js';
import { cryptoCMD } from './crypto/index.js';
import { getTurso } from './getTurso/index.js';
import { initCMD } from './init/index.js';
import { usersCMD } from './users/index.js';

const pkgJson = readJson<{ version: string }>(new URL('../../package.json', import.meta.url));

const command = Cli.Command.make('studiocms').pipe(
	Cli.Command.withDescription('StudioCMS CLI Utility Toolkit'),
	Cli.Command.withSubcommands([addPlugin, cryptoCMD, getTurso, initCMD, usersCMD])
);

// Set up the CLI application
const cli = Cli.Command.run(command, {
	name: 'StudioCMS CLI Utility Toolkit',
	version: `v${pkgJson.version}`,
});

const ConfigLive = Cli.CliConfig.layer({
	showBuiltIns: true,
});

const MainLayer = Layer.mergeAll(ConfigLive, PlatformNode.NodeContext.layer);

// Prepare and run the CLI application
Effect.suspend(() => cli(process.argv)).pipe(
	Effect.provide(MainLayer),
	PlatformNode.NodeRuntime.runMain
);
