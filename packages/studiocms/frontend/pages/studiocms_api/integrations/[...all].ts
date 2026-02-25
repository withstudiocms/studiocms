import { HttpApiToAstroRoute } from 'effectify/astro/HttpApi';
import { IntegrationsAPILive } from '../_handlers/integrations.js';

/**
 * Integrations API Route - Combines all Integrations API handlers into a single Astro route for serving the integrations-related API endpoints.
 */
export const ALL = HttpApiToAstroRoute(IntegrationsAPILive);
