import type BaseDriver from './drivers/base.js';
import type { JsonConnectionConfig } from './type.js';

export function createConnectionFromConfig(
	_configFile: string,
	_config: JsonConnectionConfig
): BaseDriver | undefined {
	return undefined;
}
