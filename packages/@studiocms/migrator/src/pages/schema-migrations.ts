import { runEffect } from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { studioCMSDbMigrator } from '../db/client.js';
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
				console.log(`Migration ${it.migrationName} applied successfully.`);
			} else if (it.status === 'Error') {
				console.error(`Error applying migration ${it.migrationName}.`);
			}
		}
	}

	if (error) {
		console.error(`Migration failed with error: ${String(error)}`);
		return jsonResponse({ success: false, error: String(error) }, 500);
	}

	return jsonResponse({ success: true });
};
