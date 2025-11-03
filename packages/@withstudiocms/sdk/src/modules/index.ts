import { Effect } from '@withstudiocms/effect';
import AUTH from './auth/index.js';
import CLEAR from './clear/index.js';
import CONFIG from './config/index.js';
import DELETE from './delete/index.js';
import diffTracking from './diffTracking/index.js';
import GET from './get/index.js';
import INIT from './init/index.js';
import notificationSettings from './notificationSettings/index.js';
import PLUGINS from './plugins/index.js';
import resetTokenBucket from './resetTokenBucket/index.js';
import REST_API from './rest_api/index.js';
import UPDATE from './update/index.js';
import UTIL from './util/index.js';

// TODO: Placeholder Effects for unimplemented modules
const placeholder = Effect.succeed('todo' as const);

/**
 * Aggregated SDK Modules Index
 *
 * This module exports all individual SDK modules as
 * a single object for easier import and management.
 */
export const SDKModules = {
	AUTH,
	CLEAR,
	CONFIG,
	DELETE,
	diffTracking,
	GET,
	INIT,
	notificationSettings,
	PLUGINS,
	resetTokenBucket,
	REST_API,
	UPDATE,
	UTIL,
	MIDDLEWARES: placeholder,
	POST: placeholder,
};

export default SDKModules;
