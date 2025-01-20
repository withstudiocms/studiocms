/**
 * Render Astro Markdown
 *
 * Renders Astro Markdown content
 *
 * Astro is the built-in Astro remark-markdown plugin.
 * @see https://www.npmjs.com/package/@astrojs/markdown-remark
 *
 * @param content - The content to render
 * @returns The rendered content
 */
export declare function renderAstroMD(content: string): Promise<string>;
export default renderAstroMD;
