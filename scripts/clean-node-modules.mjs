#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

class NodeModulesCleaner {
	constructor(rootPath = process.cwd()) {
		this.rootPath = path.resolve(rootPath);
		this.foundDirectories = [];
		this.deletedDirectories = [];
		this.errors = [];
	}

	async findNodeModules(dir = this.rootPath) {
		try {
			const entries = await fs.promises.readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					if (entry.name === 'node_modules') {
						this.foundDirectories.push(fullPath);
					} else {
						// Skip common directories that shouldn't contain node_modules
						const skipDirs = ['.git', '.vscode', 'dist', 'build', 'coverage'];
						if (!skipDirs.includes(entry.name)) {
							await this.findNodeModules(fullPath);
						}
					}
				}
			}
		} catch (error) {
			this.errors.push({ path: dir, error: error.message });
		}
	}

	async deleteDirectory(dirPath) {
		try {
			await fs.promises.rm(dirPath, { recursive: true, force: true });
			this.deletedDirectories.push(dirPath);
			return true;
		} catch (error) {
			this.errors.push({ path: dirPath, error: error.message });
			return false;
		}
	}

	async clean(dryRun = false) {
		console.log(`🔍 Scanning for node_modules directories in: ${this.rootPath}`);

		await this.findNodeModules();

		if (this.foundDirectories.length === 0) {
			console.log('✅ No node_modules directories found.');
			return;
		}

		console.log(`\n📁 Found ${this.foundDirectories.length} node_modules directories:`);
		this.foundDirectories.forEach((dir, index) => {
			console.log(`  ${index + 1}. ${path.relative(this.rootPath, dir)}`);
		});

		if (dryRun) {
			console.log('\n🔍 Dry run mode - no directories will be deleted.');
			return;
		}

		console.log('\n🗑️  Deleting directories...');

		for (const dir of this.foundDirectories) {
			const relativePath = path.relative(this.rootPath, dir);
			process.stdout.write(`  Deleting ${relativePath}... `);

			const success = await this.deleteDirectory(dir);
			console.log(success ? '✅' : '❌');
		}

		// Summary
		console.log('\n📊 Summary:');
		console.log(`  ✅ Successfully deleted: ${this.deletedDirectories.length}`);
		console.log(`  ❌ Failed to delete: ${this.errors.length}`);

		if (this.errors.length > 0) {
			console.log('\n❌ Errors:');

			for (const { path, error } of this.errors) {
				console.log(`  ${path}: ${error}`);
			}
		}
	}

	async getSizeInfo() {
		const sizes = [];

		for (const dir of this.foundDirectories) {
			try {
				// Use du command on Unix-like systems
				const sizeOutput = execSync(`du -sh "${dir}" 2>/dev/null || echo "0B"`, {
					encoding: 'utf8',
				});
				const size = sizeOutput.trim().split('\t')[0];
				sizes.push({ path: dir, size });
			} catch (error) {
				sizes.push({ path: dir, size: 'Unknown' });
			}
		}

		return sizes;
	}
}

// CLI interface
async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run') || args.includes('-n');
	const showHelp = args.includes('--help') || args.includes('-h');
	const showSizes = args.includes('--sizes') || args.includes('-s');

	if (showHelp) {
		console.log(`
Node Modules Cleaner
====================

Usage: node clean-node-modules.mjs [options] [path]

Options:
  --dry-run, -n    Show what would be deleted without actually deleting
  --sizes, -s      Show size information for each node_modules directory
  --help, -h       Show this help message

Examples:
  node clean-node-modules.mjs                    # Clean current directory
  node clean-node-modules.mjs /path/to/monorepo  # Clean specific directory
  node clean-node-modules.mjs --dry-run          # Preview what would be deleted
  node clean-node-modules.mjs --sizes            # Show sizes before cleaning
`);
		return;
	}

	// Get target directory (default to current directory)
	const targetPath =
		args.find((arg) => !arg.startsWith('--') && !arg.startsWith('-')) || process.cwd();

	if (!fs.existsSync(targetPath)) {
		console.error(`❌ Error: Directory '${targetPath}' does not exist.`);
		process.exit(1);
	}

	const cleaner = new NodeModulesCleaner(targetPath);

	if (showSizes) {
		console.log('📊 Calculating sizes...');
		await cleaner.findNodeModules();
		const sizes = await cleaner.getSizeInfo();

		if (sizes.length === 0) {
			console.log('✅ No node_modules directories found.');
			return;
		}

		console.log('\n📁 Node modules directories and their sizes:');

		for (const { path, size } of sizes) {
			console.log(`  ${size.padStart(8)} ${path}`);
		}

		console.log(`\n📊 Total directories found: ${sizes.length}`);
		return;
	}

	await cleaner.clean(dryRun);
}

// Run the script
main().catch((error) => {
	console.error('❌ Unexpected error:', error.message);
	process.exit(1);
});

export default NodeModulesCleaner;
