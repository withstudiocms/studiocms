import type { PluginRenderer } from 'studiocms/types';
import { shared } from '../lib/shared.js';

/**
 * The HTML renderer configuration for StudioCMS.
 *
 * This renderer is responsible for handling HTML content within StudioCMS,
 * utilizing shared configuration options for sanitization and rendering.
 *
 * (StudioCMS can technically already render HTML out of the box,
 * but will error without any renderer configured for HTML content types.)
 */
const renderer: PluginRenderer = {
	name: '@studiocms/html',
	sanitizeOpts: shared.htmlConfig?.sanitize,
};

export default renderer;
