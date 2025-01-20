/**
 * Render a Markdown string into HTML using the Markdoc renderer
 *
 * Markdoc is a powerful, flexible, Markdown-based authoring framework. Built by Stripe.
 * @see https://markdoc.dev/ for more info about markdoc.
 *
 * @param input - The Markdown string to render
 * @returns The rendered HTML string
 */
export declare function renderMarkDoc(input: string): Promise<string>;
export default renderMarkDoc;
