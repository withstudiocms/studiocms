import { RestAPIV1Live } from './v1/index.js';

/**
 * Live REST API Handler Layer - Provides the REST API with all necessary dependencies for live operation.
 *
 * For now, We just re-export the V1 live handler, but in the future, this can be expanded to include additional versions
 */
export const RestAPILive = RestAPIV1Live;
