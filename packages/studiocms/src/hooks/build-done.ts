import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { defineUtility } from 'astro-integration-kit';
import type { Messages } from '../types';

export const buildDone = defineUtility('astro:build:done')(
	({ logger }, verbose: boolean, messages: Messages) => {
		// Log messages at the end of the build
		for (const { label, message, logLevel } of messages) {
			integrationLogger(
				{
					logger: logger.fork(label),
					logLevel,
					verbose: logLevel === 'info' ? verbose : true,
				},
				message
			);
		}
	}
);

export default buildDone;
