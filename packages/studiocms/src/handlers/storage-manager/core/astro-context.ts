import { runSDK, SDKCoreJs } from 'studiocms:sdk';
import { UserPermissionLevel } from '@withstudiocms/auth-kit/types';
import type { APIContext } from 'astro';
import type {
	ContextDriverDefinition,
	ContextHandler,
	ContextHandlerFn,
	ParsedContext,
} from '../definitions';

export default class AstroContextDriver implements ContextDriverDefinition<APIContext, Response> {
	parseContext({ request, locals }: APIContext): ParsedContext {
		return {
			getJson: () => request.json(),
			getArrayBuffer: () => request.arrayBuffer(),
			getHeader: (name: string) => request.headers.get(name),
			isAuthorized: async (type) => {
				switch (type) {
					case 'headers': {
						const authTokenData = request.headers.get('Authorization');

						if (!authTokenData) {
							return false;
						}
						const parts = authTokenData.split(' ');
						if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
							return false;
						}
						const token = parts[1];

						const user = await runSDK(SDKCoreJs.REST_API.tokens.verify(token));

						if (!user) {
							return false;
						}

						let level: UserPermissionLevel;

						switch (user.rank) {
							case 'owner':
								level = UserPermissionLevel.owner;
								break;
							case 'admin':
								level = UserPermissionLevel.admin;
								break;
							case 'editor':
								level = UserPermissionLevel.editor;
								break;
							case 'visitor':
								level = UserPermissionLevel.visitor;
								break;
							default:
								level = UserPermissionLevel.unknown;
						}

						const isEditor = level >= UserPermissionLevel.editor;

						if (!isEditor) {
							return false;
						}

						return true;
					}
					default: {
						const isEditor = locals.StudioCMS.security?.userPermissionLevel.isEditor || false;
						return isEditor;
					}
				}
			},
		};
	}

	buildResponse(opts: { data: unknown; status: number }): Response {
		return new Response(JSON.stringify(opts.data), {
			headers: { 'Content-Type': 'application/json' },
			status: opts.status,
		});
	}

	buildErrorResponse(error: unknown) {
		return { data: { error: (error as Error).message }, status: 500 };
	}

	handleEndpoint(contextHandler: ContextHandler): ContextHandlerFn<APIContext, Response> {
		return async (rawContext: APIContext): Promise<Response> => {
			try {
				const context = this.parseContext(rawContext);
				const opts = await contextHandler(context);
				return this.buildResponse(opts);
			} catch (error) {
				const errorResponse = this.buildErrorResponse(error);
				return this.buildResponse(errorResponse);
			}
		};
	}
}
