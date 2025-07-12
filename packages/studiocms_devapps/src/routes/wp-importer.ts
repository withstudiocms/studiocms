import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from 'studiocms/effect';
import { WPImporter } from '../effects/wpImporter.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/devapps/routes/wp-importer.POST')(function* () {
			const WP = yield* WPImporter;
			return yield* WP.runPostEvent(context);
		}).pipe(WPImporter.Provide)
	);
