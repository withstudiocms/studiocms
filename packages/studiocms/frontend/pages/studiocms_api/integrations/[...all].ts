import type { APIRoute } from 'astro';
import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import { IntegrationsAPILive } from '../_handlers/integration/index.js';

/**
 * Integrations API Route - Combines all Integrations API handlers into a single Astro route for serving the integrations-related API endpoints.
 */
export const ALL: APIRoute = HttpApiToAstroRoute(IntegrationsAPILive);
