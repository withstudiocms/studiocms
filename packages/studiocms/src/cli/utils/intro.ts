import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label, say } from '@withstudiocms/cli-kit/messages';
import { readJson } from '@withstudiocms/internal_helpers/utils';
import { Effect, genLogger } from '../../effect.js';
import { CliContext } from './context.js';
import { logger } from './logger.js';
import getSeasonalMessages from './seasonal.js';

const pkgJson = readJson<{ version: string }>(new URL('../../../package.json', import.meta.url));

// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any
export const random = (...arr: any[]) => {
	const flattenedArray = arr.flat(1);
	return flattenedArray[Math.floor(flattenedArray.length * Math.random())];
};

export const intro = (debug: boolean) =>
	genLogger('studiocms/cli/utils/intro')(function* () {
		const { username } = yield* CliContext;

		const { messages } = getSeasonalMessages();

		const welcome = random(messages);

		debug && logger.debug('Printing welcome message...');

		yield* Effect.tryPromise(() =>
			say(
				[
					[
						'Welcome',
						'to',
						label('StudioCMS', StudioCMSColorwayBg, 'black'),
						StudioCMSColorway(`v${pkgJson.version}`),
						username,
					],
					welcome,
				] as string[],
				{ clear: true }
			)
		);
		debug && logger.debug('Welcome message printed');
	});
