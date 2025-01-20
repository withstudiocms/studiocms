import type { StudioCMSRendererConfig } from '@studiocms/core/schemas/renderer';
import type { AstroIntegration } from 'astro';
/**
 * **StudioCMS Renderers Integration**
 *
 * @param options StudioCMS Renderer Configuration
 * @returns AstroIntegration
 *
 * @see [StudioCMS Docs](https://docs.studiocms.dev) for more information on how to use StudioCMS.
 */
export declare function studioCMSRenderers(options: StudioCMSRendererConfig, verbose?: boolean): AstroIntegration;
export default studioCMSRenderers;
export type { StudioCMSRendererConfig };
