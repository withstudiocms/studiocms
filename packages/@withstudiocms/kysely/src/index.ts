/**
 * Migrator is left out of this index to avoid issues with `node:` imports in ESM/CJS
 * environments that do not support them. Users should import migrator-related
 * functions directly from the migrator module. `@withstudiocms/kysely/migrator`.
 */

export * from './client.js';
export * from './core/schema.js';
export * from './schema.js';

// TODO: Create a new Astro integration to handle an Astro-DB like setup
// but utilizing Kysely under the hood. This will allow users to also
// benefit from our new Kysely DB package when using Astro.
// Astro plans to deprecate Astro-DB in the future, so we should attempt
// to provide a smooth migration path for our users before that happens.
