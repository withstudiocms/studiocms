#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

console.log('Starting StudioCMS Migrator...');

import('./dist/server/entry.mjs').then((mod) => mod);
