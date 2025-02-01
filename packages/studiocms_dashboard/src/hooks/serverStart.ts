import { defineUtility } from 'astro-integration-kit';
import type { StudioCMSDashboardOptions } from '../schema.js';
import { integrationLogger } from '../utils/integrationLogger.js';

export const serverStart = defineUtility('astro:server:start')(
	({ logger }, { dbStartPage }: StudioCMSDashboardOptions) => {
		if (dbStartPage) {
			integrationLogger(
				{ logger, logLevel: 'warn', verbose: true },
				'Start Page is Enabled.  This will be the only page available until you initialize your database and disable the config option forcing this page to be displayed. To get started, visit http://localhost:4321/start/ in your browser to initialize your database. And Setup your installation.'
			);
		}
	}
);

export default serverStart;
