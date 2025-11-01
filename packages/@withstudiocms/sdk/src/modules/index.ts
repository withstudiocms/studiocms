import { Effect } from '@withstudiocms/effect';
import AUTH from './auth/index.js';
import CONFIG from './config/index.js';
import diffTracking from './diffTracking/index.js';
import notificationSettings from './notificationSettings/index.js';
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
	notificationSettings,
	REST_API,
	UTIL,
	resetTokenBucket,
	CLEAR: placeholder,
	DELETE: placeholder,
	GET: placeholder,
	INIT: placeholder,
	MIDDLEWARES: placeholder,
	PLUGINS: placeholder,
	POST: placeholder,
	UPDATE: placeholder,
};

export default SDKModules;
