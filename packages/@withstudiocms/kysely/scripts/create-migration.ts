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

	const stubFilepath = path.join(__dirname, 'stubs', 'migration-stub.stub');
	let template: string;
	try {
		template = await fs.readFile(stubFilepath, 'utf-8');
	} catch {
		console.error('Failed to read migration stub file');
		process.exit(1);
	}

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
