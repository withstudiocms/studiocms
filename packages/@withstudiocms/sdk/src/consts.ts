/**
 * Cache tags used throughout the SDK.
 */
export const cacheTags = {
	dynamicConfig: ['dynamic-config'],
};

export const cacheKeyGetters = {
	dynamicConfig: (id: string) => `dynamic-config:${id}`,
};
