import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { outro } from '@withstudiocms/effect/clack';
import { genLogger } from '../../../effect.js';
import { CliContext } from '../../utils/context.js';
import { logger } from '../../utils/logger.js';

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/users/steps/next')(function* () {
		const { chalk } = yield* CliContext;

		yield* outro(
			`${label('Action Complete!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
		);

		debug && logger.debug('Next steps complete');
	});
