import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { outro } from '@withstudiocms/effect/clack';
import { Effect, genLogger } from '../../../effect.js';
import { CliContext } from '../../utils/context.js';
import { buildDebugLogger } from '../../utils/logger.js';

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/users/steps/next')(function* () {
		const [{ chalk }, debugLogger] = yield* Effect.all([CliContext, buildDebugLogger(debug)]);

		yield* Effect.all([
			outro(
				`${label('Action Complete!', StudioCMSColorwayBg, chalk.bold)} Stuck? Join us on Discord at ${StudioCMSColorway.bold.underline('https://chat.studiocms.dev')}`
			),
			debugLogger('Next steps complete'),
		]);
	});
