import type { APIRoute } from 'astro';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import { AuthAPILive } from '../../_handlers/auth/index.js';

/**
 * Auth API Route - Combines all Auth API handlers into a single Astro route for serving the auth-related API endpoints.
 */
export const ALL: APIRoute = HttpApiToAstroRoute(AuthAPILive);
