import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { defineUtility } from 'astro-integration-kit';
import packageJson from 'package-json';
import { compare as semCompare } from 'semver';
import type { ServerStartOptions } from '../types';

export const serverStart = defineUtility('astro:server:start')(
	async ({ logger: l }, { messages, pkgName, pkgVersion, verbose }: ServerStartOptions) => {
		const logger = l.fork(`${pkgName}:update-check`);

		try {
			const { version: latestVersion } = await packageJson(pkgName.toLowerCase());

			const comparison = semCompare(pkgVersion, latestVersion);

			if (comparison === -1) {
				logger.warn(
					`A new version of '${pkgName}' is available. Please update to ${latestVersion} using your favorite package manager.`
				);
			} else if (comparison === 0) {
				logger.info(`You are using the latest version of '${pkgName}' (${pkgVersion})`);
			} else {
				logger.info(
					`You are using a newer version (${pkgVersion}) of '${pkgName}' than the latest release (${latestVersion})`
				);
			}
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error fetching latest version from npm registry: ${error.message}`);
			} else {
				// Handle the case where error is not an Error object
				logger.error(
					'An unknown error occurred while fetching the latest version from the npm registry.'
				);
			}
		}

		// Log all messages
		for (const { label, message, logLevel } of messages) {
			integrationLogger(
				{
					logger: l.fork(label),
					logLevel,
					verbose: logLevel === 'info' ? verbose : true,
				},
				message
			);
		}
	}
);

export default serverStart;
