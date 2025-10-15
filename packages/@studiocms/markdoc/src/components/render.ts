import renderMarkDoc from 'studiocms:markdoc/renderer';
import type { PluginRenderer } from 'studiocms/types';

/**
 * The Markdoc renderer configuration for StudioCMS.
 *
 * This renderer is responsible for handling Markdoc content within StudioCMS,
 * utilizing shared configuration options for sanitization and rendering.
 */
const renderer: PluginRenderer = {
	name: '@studiocms/markdoc',
	renderer: renderMarkDoc,
};

export default renderer;
