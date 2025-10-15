import MDRenderer from '@studiocms/md/renderer';
import type { PluginRenderer } from 'studiocms/types';

const renderer: PluginRenderer = {
	name: '@studiocms/blog',
	renderer: MDRenderer.renderer,
	sanitizeOpts: MDRenderer.sanitizeOpts,
};

export default renderer;
