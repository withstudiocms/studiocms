#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createMigration() {
	const migrationName = process.argv[2];

	if (!migrationName) {
		console.error('Please provide a migration name');
		console.error('Usage: pnpm create-migration <migration-name>');
		process.exit(1);
	}

	const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
	const filename = `${timestamp}_${migrationName}.ts`;
	const migrationsDir = path.join(__dirname, '../src/migrations');
	const filepath = path.join(migrationsDir, filename);

	const template = `import { type Kysely, sql } from 'kysely';
import type { StudioCMSDatabaseSchema } from '../tables.js';

export async function up(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
    // Migration code here
}

export async function down(db: Kysely<StudioCMSDatabaseSchema>): Promise<void> {
    // Rollback code here
}
`;

	try {
		await fs.mkdir(migrationsDir, { recursive: true });
		await fs.writeFile(filepath, template);
		console.log(`✓ Created migration: ${filename}`);
	} catch (error) {
		console.error('Failed to create migration:', error);
		process.exit(1);
	}
}

createMigration();
