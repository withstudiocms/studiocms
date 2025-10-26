#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanStubHeading(stubContent: string) {
	// Remove the existing comment and replace with a template comment
	const lines = stubContent.split('\n');
	const startIndex = lines.findIndex((line) => line.includes('/**'));
	const endIndex = lines.findIndex((line) => line.includes('*/'));

	if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
		lines.splice(
			startIndex,
			endIndex - startIndex + 1,
			'/**',
			' * - Title: <title here>',
			' * - Created: <date>',
			' * - Author: <author>',
			' * - GitHub PR: <pr>',
			' * - Description: <description>',
			' */'
		);
	}
	return lines.join('\n');
}

async function updatePreviousMigrationLabel(
	stubContent: string,
	previousMigrationFilename: string
) {
	// Find the following line:
	// const previousSchema = await getPreviousMigrationSchema(null);
	// and replace the null/argument with the previous migration filename as a string.
	const lines = stubContent.split('\n');
	const targetIndex = lines.findIndex((line) =>
		line.includes('const previousSchema = await getPreviousMigrationSchema(')
	);

	if (targetIndex !== -1) {
		lines[targetIndex] =
			`	const previousSchema = await getPreviousMigrationSchema('${previousMigrationFilename.replace(/\.ts$/, '')}');`;
	}
	return lines.join('\n');
}

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

	// get the latest migration file to copy its content as a template
	const files = await fs.readdir(migrationsDir);
	const migrationFiles = files
		.filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
		.sort();

	const latestMigrationFile = migrationFiles[migrationFiles.length - 1];
	console.log(`Found latest migration file: ${latestMigrationFile}`);

	const latestMigrationPath = path.join(migrationsDir, latestMigrationFile);
	const latestMigrationContent = await fs.readFile(latestMigrationPath, 'utf-8');

	const template = await cleanStubHeading(latestMigrationContent);

	const finalTemplate = await updatePreviousMigrationLabel(template, latestMigrationFile);

	try {
		await fs.mkdir(migrationsDir, { recursive: true });
		await fs.writeFile(filepath, finalTemplate);
		console.log(`✓ Created migration: ${filename}`);
	} catch (error) {
		console.error('Failed to create migration:', error);
		process.exit(1);
	}
}

createMigration();
