import type { APIRoute } from 'astro';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import { RestAPILive } from '../_handlers/rest-api/index.js';

/**
 * REST API Route - Combines all REST API handlers into a single Astro route for serving the REST API endpoints.
 */
export const ALL: APIRoute = HttpApiToAstroRoute(RestAPILive);
