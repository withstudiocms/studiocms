#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TableDefinition } from '../src/utils/migrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a new migration JSON file based on the most recent migration as a template.
 *
 * This async script:
 *  - Reads the desired migration name from process.argv[2]. If no name is provided, it logs usage
 *    information and exits the process with code 1.
 *  - Constructs a timestamped filename in the format: YYYYMMDDTHHMMSS_<migration-name>.json
 *    (timestamp built from new Date().toISOString() with separators removed and fractional seconds dropped).
 *  - Uses the migrations directory located at ../src/migrations relative to __dirname.
 *  - Finds the latest existing .json migration file in that directory (lexicographically sorted),
 *    reads and parses it as JSON, and reuses its structure as a template. The expected template shape:
 *      {
 *        $schema: string;
 *        title: string;
 *        created: string;
 *        author: string;
 *        githubPR: string;
 *        description: string;
 *        previousMigration: string;
 *        definition: TableDefinition[];
 *      }
 *  - Updates the template fields:
 *      - previousMigration: set to the latest migration filename without the .json extension.
 *      - created: set to the current date formatted as "MMM d, yyyy" (en-US).
 *      - title, author, githubPR, description: replaced with placeholder strings for manual editing.
 *  - Serializes the resulting JSON (2-space indentation), ensures the migrations directory exists,
 *    and writes the new migration file.
 *  - Logs a success message on creation. On failure to create/write the file, logs the error and exits
 *    the process with code 1.
 *
 * Remarks:
 *  - The script has side effects: console output, filesystem writes, and process termination in error cases.
 *  - The script expects at least one existing migration .json file to copy as a template; if none exist,
 *    the attempt to determine the latest migration will fail (causing the promise to reject).
 *  - Intended to be invoked from the command line, e.g. via: pnpm create-migration <migration-name>
 *
 * Example:
 *  pnpm create-migration add-users-table
 *
 * @returns Promise<void> Resolves when the migration file has been written. In several failure modes
 * the script calls process.exit(1) instead of propagating an exception.
 */
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

	// read the latest migration file content
	const latestMigrationContent = await fs.readFile(latestMigrationPath, 'utf-8');

	// parse content to JSON
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

	// update fields for the new migration
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

	// serialize back to JSON
	const template = JSON.stringify(JSONData, null, 2);

	// write the new migration file
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
