import renderMDX from 'studiocms:mdx/renderer';
import type { PluginRenderer } from 'studiocms/types';

const renderer = {
	name: '@studiocms/mdx',
	renderer: renderMDX,
} satisfies PluginRenderer;

export default renderer;
