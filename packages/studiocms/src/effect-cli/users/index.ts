import { Command, Options } from '@effect/cli';
import { Effect, genLogger } from '../../effect.js';

export const debug = Options.boolean('debug').pipe(
    Options.optional,
    Options.withDefault(false),
    Options.withDescription('Enable debug mode')
);

export const usersCMD = Command.make('users', { debug }, ({ debug }) =>
    genLogger('studiocms/cli/users')(function* () {

    })
).pipe(Command.withDescription('Utilities for Tweaking Users in StudioCMS'));
