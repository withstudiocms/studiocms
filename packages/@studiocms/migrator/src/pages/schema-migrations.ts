import { runEffect } from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { studioCMSDbMigrator } from '../db/client.js';
import logger from '../lib/logger.js';
import { jsonResponse } from '../lib/response-utils.js';

export const POST: APIRoute = async () => {
	const migrator = await studioCMSDbMigrator();

	const { error, results } = await runEffect(migrator.toLatest).catch((err) => ({
		error: err,
		results: undefined,
	}));

	if (results) {
		for (const it of results) {
			if (it.status === 'Success') {
				logger.info(`Migration ${it.migrationName} applied successfully.`);
			} else if (it.status === 'Error') {
				logger.error(`Error applying migration ${it.migrationName}.`);
			}
		}
	}

	if (error) {
		logger.error(`Migration failed with error: ${String(error)}`);
		return jsonResponse({ success: false, error: String(error) }, 500);
	}

	return jsonResponse({ success: true });
};
