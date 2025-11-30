import { db } from 'astro:db';
import { runEffect } from '@withstudiocms/effect';
import type { APIRoute } from 'astro';
import { getStudioCMSDb } from '../db/client.js';
import { jsonResponse } from '../lib/response-utils.js';
import { AstroDBTableSchema, KyselyTableSchema } from '../lib/tableMap.js';

const studioCMSDb = await getStudioCMSDb();

export const POST: APIRoute = async () => {
	return jsonResponse({ success: true });
};
