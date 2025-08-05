import stylesheet from '../styles/grapes.css?raw';

/**
 * Handles all HTTP methods for serving a CSS stylesheet.
 *
 * @returns {Promise<Response>} A promise that resolves to a Response object containing the CSS stylesheet,
 * with appropriate headers for content type and CORS.
 */
export async function ALL(): Promise<Response> {
    return new Response(stylesheet, {
        headers: {
            'Content-Type': 'text/css',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        }
    })
}