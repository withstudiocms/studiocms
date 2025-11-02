import { Effect } from '@withstudiocms/effect';
import AUTH from './auth/index.js';
import CONFIG from './config/index.js';
import diffTracking from './diffTracking/index.js';
import GET from './get/index.js';
import INIT from './init/index.js';
import notificationSettings from './notificationSettings/index.js';
import PLUGINS from './plugins/index.js';
import resetTokenBucket from './resetTokenBucket/index.js';
import REST_API from './rest_api/index.js';
import UTIL from './util/index.js';

// TODO: Placeholder Effects for unimplemented modules
const placeholder = Effect.succeed('todo' as const);

/**
 * Aggregated SDK Modules Index
 *
 * This module exports all individual SDK modules as a single object for easier import and management.
 */
export const SDKModules = {
	AUTH,
	CONFIG,
	diffTracking,
	INIT,
	notificationSettings,
	PLUGINS,
	resetTokenBucket,
	REST_API,
	UTIL,
	GET,
	CLEAR: placeholder,
	UPDATE: placeholder,
	DELETE: placeholder,
	MIDDLEWARES: placeholder,
	POST: placeholder,
};

export default SDKModules;
