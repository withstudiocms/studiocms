/**
 * Cache tags used throughout the SDK.
 */
export const cacheTags = {
	dynamicConfig: ['dynamic-config'],
};

/**
 * Functions to generate cache keys for various SDK operations.
 */
export const cacheKeyGetters = {
	dynamicConfig: (id: string) => `dynamic-config:${id}`,
};
