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

/**
 * Handles POST requests for executing database queries.
 */
export const POST: APIRoute = async ({ request }) => {
	const body: DbQueryRequest = await request.json();

	const driver = await getDriverInstance();

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
		return jsonResponse({
			type: body.type,
			id: body.id,
			data: r,
		});
	} catch (e) {
		return jsonResponse({
			type: body.type,
			id: body.id,
			error: (e as Error).message,
		});
	}
};
