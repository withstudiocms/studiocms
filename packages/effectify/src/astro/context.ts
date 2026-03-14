import type { APIContext } from 'astro';
import * as Context from 'effect/Context';

/**
 * A Context Reference for Astro API route locals.
 *
 * This context allows you to access the Astro API route context within your Effect handlers.
 * You can use this to access request-specific data, such as parameters, headers, or any other
 * information that is relevant to the current API route.
 *
 * Example usage:
 *
 * ```ts
 * import { AstroAPIContext } from './context.ts';
 * import { pipe } from 'effect/Function';
 * import { Effect } from 'effect/Effect';
 *
 * const handler = (request: Request) => {
 *   return pipe(
 *     Effect.contextWith((ctx) => {
 *       const apiContext = ctx.get(AstroAPIContext);
 *       // You can now access apiContext.params, apiContext.request, etc.
 *     }),
 *     Effect.map(() => new Response('Hello, world!'))
 *   );
 * };
 * ```
 *
 * In this example, the `AstroAPIContext` is used to access the API context within an Effect handler.
 * This allows you to write your request handling logic in a functional style while still having
 * access to the necessary context provided by Astro.
 *
 * Note: The `AstroAPIContext` is designed to be used within the context of an Astro API route handler.
 * Make sure to provide the appropriate context when invoking your Effect handlers to ensure that
 * the `AstroAPIContext` is available.
 */
export class AstroAPIContext extends Context.Reference<AstroAPIContext>()(
	'effectify/astro/context.AstroAPIContext',
	{
		defaultValue: () => ({}) as APIContext,
	}
) {}
