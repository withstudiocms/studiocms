import {
	AllResponse,
	createEffectAPIRoute,
	createJsonResponse,
	genLogger,
	type HTTPMethod,
} from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { Effect, type ParseResult, Schema, type SchemaAST } from 'effect';
import type { NonEmptyReadonlyArray } from 'effect/Array';
import { extractParams } from './param-extractor';

type RegistryEntry<IdType extends 'number' | 'string' = 'number'> = {
	__idType: IdType;
	__index: Partial<Record<HTTPMethod | 'ALL', APIRoute>>;
	id?: (
		id: IdType extends 'number' ? number : string
	) => Partial<Record<HTTPMethod | 'ALL', APIRoute>>;
};

export type EndpointRoute = RegistryEntry<'number'> | RegistryEntry<'string'>;

export type RouteRegistry = {
	[type: string]: EndpointRoute;
};

const firstLetterUppercase = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

function isNumber(value: unknown): value is number {
	return typeof value === 'number' && !Number.isNaN(value);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export const createRestRouter =
	<const Literals extends NonEmptyReadonlyArray<SchemaAST.LiteralValue>>(
		prefix: string,
		types: Schema.Literal<Literals>
	) =>
	(registry: RouteRegistry) => {
		const paramSchemaBase = Schema.Struct({
			type: types,
			id: Schema.optional(Schema.String),
		});

		const getTypeLabel = ({ actual }: ParseResult.ParseIssue) => {
			if (Schema.is(paramSchemaBase)(actual)) {
				return `Type: ${firstLetterUppercase(actual.type?.toString() ?? '')}`;
			}
		};

		const paramSchema = paramSchemaBase.annotations({
			identifier: 'TypeParams',
			parseIssueTitle: getTypeLabel,
		});

		return createEffectAPIRoute(
			extractParams(paramSchema)(({ type, id = '__index' }, ctx) =>
				genLogger(`${prefix}:${type}${id !== '__index' ? `:${id}` : ''}:${ctx.request.method}`)(
					function* () {
						const method = ctx.request.method.toUpperCase() as keyof Record<
							HTTPMethod | 'ALL',
							APIRoute
						>;
						const routeGroup = registry[type as string];

						let handlers: Partial<Record<HTTPMethod | 'ALL', APIRoute>> | undefined;

						switch (routeGroup.__idType) {
							case 'number': {
								if (id === '__index') {
									handlers = routeGroup.__index;
								} else {
									const numericId = Number(id);
									if (!isNumber(numericId)) {
										return createJsonResponse(
											{ error: `Invalid ID for type ${type}: ${id}` },
											{ status: 400 }
										);
									}
									handlers = routeGroup.id ? routeGroup.id(numericId) : undefined;
								}
								break;
							}
							case 'string': {
								if (id === '__index') {
									handlers = routeGroup.__index;
								} else {
									if (!isString(id)) {
										return createJsonResponse(
											{ error: `Invalid ID for type ${type}: ${id}` },
											{ status: 400 }
										);
									}
									handlers = routeGroup.id ? routeGroup.id(id) : undefined;
								}
								break;
							}
						}

						const handler = handlers ? handlers[method] || handlers.ALL : undefined;

						if (!handler) {
							return AllResponse();
						}

						const response = yield* Effect.tryPromise({
							try: async () => await handler(ctx),
							catch: (error) =>
								new Error(`Error in handler for ${type}/${id} [${method}]: ${String(error)}`),
						}).pipe(
							Effect.catchAll((error) =>
								Effect.logError(`API Route Error: ${String(error)}`).pipe(
									Effect.as(createJsonResponse({ error: 'Internal Server Error' }, { status: 500 }))
								)
							)
						);

						return response;
					}
				)
			)
		);
	};
