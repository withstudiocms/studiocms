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

async function updatePreviousMigrationImport(
	stubContent: string,
	previousMigrationFilename: string
) {
	const lines = stubContent.split('\n');
	const placeholderContent = `// import { schemaDefinition as previousSchema } from './placeholder-for-previous-migration.js';`;
	const targetIndex = lines.findIndex((line) => line.includes(placeholderContent));

	if (targetIndex !== -1) {
		lines[targetIndex] =
			`import { schemaDefinition as previousSchema } from './${previousMigrationFilename.replace(/\.ts$/, '')}.js';`;
	}

	if (targetIndex === -1) {
		// If the placeholder import line is not found, look a real import line
		const targetIndexReal = lines.findIndex((line) =>
			line.includes('import { schemaDefinition as previousSchema } from')
		);
		if (targetIndexReal !== -1) {
			lines[targetIndexReal] =
				`import { schemaDefinition as previousSchema } from './${previousMigrationFilename.replace(/\.ts$/, '')}.js';`;
		}
	}

	// Update the previousSchema constant if it is defined as an empty array
	const updateConstantIndex = lines.findIndex((line) =>
		line.includes('const previousSchema: TableDefinition[] = [];')
	);

	if (updateConstantIndex !== -1) {
		lines.splice(updateConstantIndex, 2);
	}

	return lines.join('\n');
}

async function cleanup(content: string, previousMigrationFilename: string) {
	let updatedContent = await cleanStubHeading(content);
	updatedContent = await updatePreviousMigrationImport(updatedContent, previousMigrationFilename);
	return updatedContent;
}

async function appendNewMigrationToIndex(migrationFilename: string) {
	const indexPath = path.join(__dirname, '../src/migrator.ts');

	// Read the existing migrator file for `const migrations: Record<string, Migration> = {}`
	// Since there is multiple constructs, we will append just before the closing `};`
	const indexContent = await fs.readFile(indexPath, 'utf-8');
	const lines = indexContent.split('\n');

	const startOfMigrationsIndex = lines.findIndex((line) =>
		line.includes('const migrationIndex: Record<string, Migration> = {')
	);
	const endOfMigrationsIndex = lines.findIndex(
		(line, index) => index > startOfMigrationsIndex && line.includes('};')
	);

	if (startOfMigrationsIndex === -1 || endOfMigrationsIndex === -1) {
		console.error('Could not find migrationIndex object in /src/migrator.ts');
		return;
	}

	// Insert the new migration import line before the closing `};`
	const migrationKey = migrationFilename.replace('.ts', '');
	const importLine = `\t'${migrationKey}': await importMigration('${migrationKey}'),`;

	lines.splice(endOfMigrationsIndex, 0, importLine);

	// Write back the updated migrator file
	const updatedIndexContent = lines.join('\n');
	await fs.writeFile(indexPath, updatedIndexContent, 'utf-8');
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

	const template = await cleanup(latestMigrationContent, latestMigrationFile);

	try {
		await fs.mkdir(migrationsDir, { recursive: true });
		await fs.writeFile(filepath, template, 'utf-8');

		// Append the new migration to the migrator index
		await appendNewMigrationToIndex(filename);

		console.log(`✓ Created migration: ${filename}`);
	} catch (error) {
		console.error('Failed to create migration:', error);
		process.exit(1);
	}
}

createMigration();
