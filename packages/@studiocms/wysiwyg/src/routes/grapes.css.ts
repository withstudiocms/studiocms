import stylesheet from '../styles/grapes.css?raw';

export async function ALL() {
    return new Response(stylesheet, {
        headers: {
            'Content-Type': 'text/css',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        }
    })
}