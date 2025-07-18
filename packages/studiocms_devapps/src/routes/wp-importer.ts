import type { APIContext, APIRoute } from 'astro';
import { convertToVanilla, genLogger } from 'studiocms/effect';
import { AstroAPIContextProvider } from '../effects/WordPressAPI/configs.js';
import { WPImporter } from '../effects/wpImporter.js';

export const POST: APIRoute = async (context: APIContext) =>
	await convertToVanilla(
		genLogger('@studiocms/devapps/routes/wp-importer.POST')(function* () {
			const WP = yield* WPImporter;
			return yield* WP.runPostEvent.pipe(AstroAPIContextProvider.makeProvide(context));
		}).pipe(WPImporter.Provide)
	);
