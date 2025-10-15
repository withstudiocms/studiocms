import renderMDX from 'studiocms:mdx/renderer';
import type { PluginRenderer } from 'studiocms/types';

const renderer: PluginRenderer = {
	name: '@studiocms/mdx',
	renderer: renderMDX,
};

export default renderer;
