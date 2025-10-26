#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TableDefinition } from '../src/utils/migrator.js';

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
	const filename = `${timestamp}_${migrationName}.json`;
	const migrationsDir = path.join(__dirname, '../src/migrations');
	const filepath = path.join(migrationsDir, filename);

	// get the latest migration file to copy its content as a template
	const files = await fs.readdir(migrationsDir);
	const migrationFiles = files.filter((file) => file.endsWith('.json')).sort();

	const latestMigrationFile = migrationFiles[migrationFiles.length - 1];
	console.log(`Found latest migration file: ${latestMigrationFile}`);

	const latestMigrationPath = path.join(migrationsDir, latestMigrationFile);
	const latestMigrationContent = await fs.readFile(latestMigrationPath, 'utf-8');

	const JSONData = JSON.parse(latestMigrationContent) as {
		$schema: string;
		title: string;
		created: string;
		author: string;
		githubPR: string;
		description: string;
		previousMigration: string;
		definition: TableDefinition[];
	};

	JSONData.previousMigration = latestMigrationFile.replace('.json', '');
	JSONData.created = new Date().toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
	JSONData.title = '<title here>';
	JSONData.author = '<author>';
	JSONData.githubPR = '<pr>';
	JSONData.description = '<description>';

	const template = JSON.stringify(JSONData, null, 2);

	try {
		await fs.mkdir(migrationsDir, { recursive: true });
		await fs.writeFile(filepath, template, 'utf-8');
		console.log(`✓ Created migration: ${filename}`);
	} catch (error) {
		console.error('Failed to create migration:', error);
		process.exit(1);
	}
}

createMigration();
