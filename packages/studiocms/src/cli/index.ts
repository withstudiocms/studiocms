import { CliConfig, Command } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { readJson } from '@withstudiocms/cli-kit/utils';
import { Effect, Layer } from '../effect.js';
import { addPlugin } from './add/index.js';
import { cryptoCMD } from './crypto/index.js';
import { getTurso } from './getTurso/index.js';
import { initCMD } from './init/index.js';
import { usersCMD } from './users/index.js';

const pkgJson = readJson<{ version: string }>(new URL('../../package.json', import.meta.url));

const command = Command.make('studiocms').pipe(
	Command.withDescription('StudioCMS CLI Utility Toolkit'),
	Command.withSubcommands([addPlugin, cryptoCMD, getTurso, initCMD, usersCMD])
);

// Set up the CLI application
const cli = Command.run(command, {
	name: 'StudioCMS CLI Utility Toolkit',
	version: `v${pkgJson.version}`,
});

const ConfigLive = CliConfig.layer({
	showBuiltIns: true,
});

const MainLayer = Layer.mergeAll(ConfigLive, NodeContext.layer);

// Prepare and run the CLI application
Effect.suspend(() => cli(process.argv)).pipe(Effect.provide(MainLayer), NodeRuntime.runMain);
