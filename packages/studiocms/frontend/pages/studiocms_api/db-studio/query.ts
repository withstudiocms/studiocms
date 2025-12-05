import { config, developerConfig } from 'studiocms:config';
import { CMSLogger, type LoggerLevel } from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { type BaseDriver, type DbQueryRequest, getDriver } from '#toolbar/db-studio';

const driverMemory = new Map<string, BaseDriver>();

/**
 * Retrieves a singleton instance of the database driver.
 *
 * @returns {Promise<BaseDriver>} The database driver instance.
 */
export async function getDriverInstance(): Promise<BaseDriver> {
	const key = 'driver-instance';
	if (driverMemory.has(key)) {
		const driver = driverMemory.get(key);
		if (driver) {
			return driver;
		}
	}

	const driver = await getDriver();
	driverMemory.set(key, driver);
	await driver.init();
	return driver;
}

/**
 * Creates a JSON response.
 *
 * @param {unknown} data - The data to include in the response.
 * @returns {Response} The JSON response.
 */
const jsonResponse = (data: unknown): Response =>
	new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' },
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

/**
 * Handles POST requests for executing database queries.
 */
export const POST: APIRoute = async ({ request, locals }) => {
	// Determine if we are in development mode
	const isDev = import.meta.env.DEV;

	const logLevel = parseLogLevel(config.logLevel);

	const log = new CMSLogger({ level: logLevel }, 'studiocms:database/studio');

	// Check if demo mode is enabled
	if (developerConfig.demoMode !== false) {
		return new Response('Demo mode is enabled, this action is not allowed.', { status: 403 });
	}

	// Security check: only allow access in the following cases
	// 1. In development mode
	// 2. In production, only if the user is an owner
	if (!isDev && !locals.StudioCMS.security?.userPermissionLevel.isOwner) {
		return new Response('Forbidden', { status: 403 });
	}

	// Parse the request body
	const body: DbQueryRequest = await request.json();

	// Get the database driver instance
	const driver = await getDriverInstance();

	log.debug(`Received ${body.type} request`);

	try {
		if (body.type === 'query') {
			const r = await driver.query(body.statement);
			return jsonResponse({
				type: body.type,
				id: body.id,
				data: r,
			});
		}

		const r = await driver.batch(body.statements);

		log.debug(`Executed ${body.type} request successfully`);

		return jsonResponse({
			type: body.type,
			id: body.id,
			data: r,
		});
	} catch (e) {
		log.error(`Error handling ${body.type} request with ID ${body.id}: ${(e as Error).message}`);
		return jsonResponse({
			type: body.type,
			id: body.id,
			error: (e as Error).message,
		});
	}
};
