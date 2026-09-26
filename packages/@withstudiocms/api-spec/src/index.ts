/**
 * This file serves as the main entry point for the API specifications of StudioCMS. It exports all the different API groups and their respective specifications, allowing other parts of the application to easily import and utilize them. Each API group is defined in its own module, and this index file aggregates them for convenient access.
 */

export { StudioCMSAuthApi } from './auth/index.js';
export { StudioCMSDashboardApiSpec } from './dashboard/index.js';
export { StudioCMSIntegrationsApiSpec } from './integrations/index.js';
export { StudioCMSRestApiV1Spec } from './rest-api/v1/index.js';
export { StudioCMSSDKApiSpec } from './sdk/index.js';
