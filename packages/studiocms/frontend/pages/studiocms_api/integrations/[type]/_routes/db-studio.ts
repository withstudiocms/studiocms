import config, { developerConfig } from 'studiocms:config';
import {
	AllResponse,
	CMSLogger,
	createEffectAPIRoutes,
	createJsonResponse,
	genLogger,
	type LoggerLevel,
	OptionsResponse,
} from '@withstudiocms/effect';
import { Data, Effect } from 'effect';
import { type EndpointRoute, pathRouter, type SubPathRouter } from '#frontend/utils/rest-router.js';
import { type BaseDriver, type DbQueryRequest, getDriver } from '#toolbar/db-studio';

export class DriverError extends Data.TaggedError('DriverError')<{ message: string }> {}

let driver: BaseDriver | undefined;

const useDriverErrorPromise = <T>(_try: () => Promise<T>) =>
	Effect.tryPromise({
		try: _try,
		catch: (error) =>
			new DriverError({ message: error instanceof Error ? error.message : String(error) }),
	});

const getDriverInstance = () =>
	Effect.gen(function* () {
		// Return existing driver if already initialized
		if (driver) return driver;

		// Attempt to get and initialize the driver
		driver = yield* useDriverErrorPromise(() => getDriver()).pipe(
			Effect.tap((drv) => useDriverErrorPromise(() => drv.init()))
		);

		// If driver is still undefined, return an error
		if (!driver) {
			return yield* new DriverError({ message: 'Failed to get database driver' });
		}

		// Return the initialized driver
		return driver;
	});

const parseLogLevel = (
	level: 'All' | 'Fatal' | 'Error' | 'Warning' | 'Info' | 'Debug' | 'Trace' | 'None'
): LoggerLevel => {
	switch (level) {
		case 'Info':
			return 'info';
		case 'Warning':
			return 'warn';
		case 'Error':
			return 'error';
		case 'All':
		case 'Fatal':
		case 'Debug':
		case 'Trace':
			return 'debug';
		case 'None':
			return 'silent';
	}
};

const jsonResponse = (data: unknown, status = 200): Response =>
	new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' },
		status,
	});

const dbStudioSubRouter: SubPathRouter = {
	query: (_id: string) =>
		createEffectAPIRoutes(
			{
				POST: ({ request, locals }) =>
					genLogger('studiocms:integrations:db-studio:query:POST')(function* () {
						// Determine if we are in development mode
						const isDev = import.meta.env.DEV;

						const logLevel = parseLogLevel(config.logLevel);

						const log = new CMSLogger({ level: logLevel }, 'studiocms:database/studio');

						// Check if demo mode is enabled
						if (developerConfig.demoMode !== false) {
							return createJsonResponse(
								{ error: 'Demo mode is enabled, this action is not allowed.' },
								{ status: 403 }
							);
						}

						// Security check: only allow access in the following cases
						// 1. In development mode
						// 2. In production, only if the user is an owner
						if (!isDev && !locals.StudioCMS.security?.userPermissionLevel.isOwner) {
							return createJsonResponse({ error: 'Forbidden' }, { status: 403 });
						}

						// Parse the request body
						const body: DbQueryRequest = yield* Effect.tryPromise({
							try: () => request.json(),
							catch: (error) =>
								new DriverError({
									message: `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`,
								}),
						});

						// Get the database driver instance
						const driver = yield* getDriverInstance();

						log.debug(`Received ${body.type} request`);

						try {
							if (body.type === 'query') {
								const r = yield* useDriverErrorPromise(() => driver.query(body.statement));
								return jsonResponse({
									type: body.type,
									id: body.id,
									data: r,
								});
							}

							const r = yield* useDriverErrorPromise(() => driver.batch(body.statements));

							log.debug(`${body.type} executed with ${r.length} results`);

							return jsonResponse({
								type: body.type,
								id: body.id,
								data: r,
							});
						} catch (e) {
							log.error(
								`Error handling ${body.type} request with ID ${body.id}: ${(e as Error).message}`
							);
							return jsonResponse(
								{
									type: body.type,
									id: body.id,
									error: (e as Error).message,
								},
								500
							);
						}
					}),
				OPTIONS: () => Effect.try(() => OptionsResponse({ allowedMethods: ['POST', 'OPTIONS'] })),
				ALL: () => Effect.try(() => AllResponse()),
			},
			{
				cors: { methods: ['POST', 'OPTIONS'] },
				onError: (error) => {
					console.error('API Error:', error);
					return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
				},
			}
		),
};

export const dbStudioRoute: EndpointRoute = {
	__idType: 'string',
	__index: createEffectAPIRoutes(
		{
			ALL: () => Effect.try(() => AllResponse()),
		},
		{
			cors: {},
			onError: (error) => {
				console.error('API Error:', error);
				return createJsonResponse({ error: 'Something went wrong' }, { status: 500 });
			},
		}
	),
	id: (id: string) => pathRouter(id, dbStudioSubRouter),
};
