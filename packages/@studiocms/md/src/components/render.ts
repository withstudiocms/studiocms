import { preRender } from 'studiocms:md/pre-render';
import type { PluginRenderer } from 'studiocms/types';
import { shared } from '../lib/shared';

const render: PluginRenderer = {
	name: '@studiocms/md',
	renderer: preRender(),
	sanitizeOpts: shared.mdConfig?.sanitize,
};

export default render;
