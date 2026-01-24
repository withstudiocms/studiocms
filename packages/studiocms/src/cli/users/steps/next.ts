import { styleText } from 'node:util';
import { StudioCMSColorway, StudioCMSColorwayBg } from '@withstudiocms/cli-kit/colors';
import { label } from '@withstudiocms/cli-kit/messages';
import { outro } from '@withstudiocms/effect/clack';
import { Effect, genLogger } from '../../../effect.js';
import { buildDebugLogger } from '../../utils/logger.js';

export const next = (debug: boolean) =>
	genLogger('studiocms/cli/users/steps/next')(function* () {
		const debugLogger = yield* buildDebugLogger(debug);

		yield* Effect.all([
			outro(
				`${label('Action Complete!', StudioCMSColorwayBg, 'bold')} Stuck? Join us on Discord at ${StudioCMSColorway(styleText(['bold', 'underline'], 'https://chat.studiocms.dev'))}`
			),
			debugLogger('Next steps complete'),
		]);
	});
