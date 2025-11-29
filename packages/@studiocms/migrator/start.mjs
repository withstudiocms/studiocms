#!/usr/bin/env node
import 'dotenv/config';

console.log('Starting StudioCMS Migrator...');

import('./dist/server/entry.mjs').then((mod) => mod);
