import type { PluginRenderer } from 'studiocms/types';
import { preRenderer } from '../lib/prerender.js';
import { shared } from '../lib/shared.js';

const renderer: PluginRenderer = {
	name: '@studiocms/wysiwyg',
	renderer: preRenderer,
	sanitizeOpts: shared?.sanitize,
};

export default renderer;
