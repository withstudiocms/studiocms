import { Args, CliConfig, Command, Options } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { readJson } from '@withstudiocms/cli-kit/utils';
import { Console, Effect, Layer } from '../effect.js';
import { addPlugin } from './add/index.js';
import { cryptoCMD } from './crypto/index.js';

const pkgJson = readJson<{ version: string }>(new URL('../../package.json', import.meta.url));

const command = Command.make('studiocms').pipe(
	Command.withDescription('StudioCMS CLI Utility Toolkit'),
	Command.withSubcommands([addPlugin, cryptoCMD])
);

// Set up the CLI application
const cli = Command.run(command, {
	name: 'StudioCMS CLI Utility Toolkit',
	version: `v${pkgJson.version}`,
});

// Prepare and run the CLI application
cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
