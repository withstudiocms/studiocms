import { stripLeadingAndTrailingSlashes } from './pathGenerators.js';

/**
 * Removes leading and trailing slashes from a URL
 *
 * @param {string} path The URL to remove slashes from (e.g. '/example/blog/')
 * @returns {string} The URL with leading and trailing slashes removed (e.g. 'example/blog')
 *
 * @deprecated Use `stripLeadingAndTrailingSlashes` from pathGenerators instead.
 */
export const removeLeadingTrailingSlashes = stripLeadingAndTrailingSlashes;
