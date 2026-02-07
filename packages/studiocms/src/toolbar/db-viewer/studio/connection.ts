/**
 * @packageDocumentation
 * @module StudioCMS/Toolbar/DBViewer/Studio/Connection
 *
 * This module is used for providing types for our .d.ts files or the 'virtual:studiocms/db-studio/connection' module.
 */

import type BaseDriver from './drivers/base.js';
import type { JsonConnectionConfig } from './type.js';

export function createConnectionFromConfig(
	_configFile: string,
	_config: JsonConnectionConfig
): BaseDriver | undefined {
	return undefined;
}
