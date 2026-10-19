import { preRender } from 'studiocms:md/pre-render';
import type { PluginRenderer } from 'studiocms/types';
import { shared } from '../lib/shared.js';

const render = {
	name: '@studiocms/md',
	renderer: preRender(),
	sanitizeOpts: shared.mdConfig?.sanitize,
} satisfies PluginRenderer;

export default render;
