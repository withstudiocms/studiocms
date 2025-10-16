import MDRenderer from '@studiocms/md/renderer';
import type { PluginRenderer } from 'studiocms/types';

const renderer = {
	name: '@studiocms/blog',
	renderer: MDRenderer.renderer,
	sanitizeOpts: MDRenderer.sanitizeOpts,
} satisfies PluginRenderer;

export default renderer;
