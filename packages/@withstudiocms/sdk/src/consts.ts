/**
 * Cache tags used throughout the SDK.
 */
export const cacheTags = {
	dynamicConfig: ['dynamic-config'],
	npmPackage: ['npm-package'],
};

/**
 * Functions to generate cache keys for various SDK operations.
 */
export const cacheKeyGetters = {
	dynamicConfig: (id: string) => `dynamic-config:${id}`,
	npmPackage: (name: string, version: string) => `npm-package:${name.replace('/', '-')}:${version}`,
};
