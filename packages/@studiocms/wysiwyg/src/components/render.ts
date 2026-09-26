import type { PluginRenderer } from 'studiocms/types';
import { preRenderer } from '../lib/prerender.js';
import { shared } from '../lib/shared.js';

const renderer = {
	name: '@studiocms/wysiwyg',
	renderer: preRenderer,
	sanitizeOpts: shared?.sanitize,
} satisfies PluginRenderer;

export default renderer;
