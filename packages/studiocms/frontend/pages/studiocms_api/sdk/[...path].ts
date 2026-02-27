import type { APIRoute } from 'astro';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import { SDKAPILive } from '../_handlers/sdk.js';

/**
 * SDK API Route - Combines all SDK API handlers into a single Astro route for serving the SDK-related API endpoints.
 */
export const ALL: APIRoute = HttpApiToAstroRoute(SDKAPILive);
