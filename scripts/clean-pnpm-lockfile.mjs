#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

class PnpmLockfileCleaner {
	constructor(rootPath = process.cwd()) {
		this.rootPath = path.resolve(rootPath);
		this.lockfilePath = path.join(this.rootPath, 'pnpm-lock.yaml');
	}

	async clean() {
		if (!fs.existsSync(this.lockfilePath)) {
			console.log(`✅ No lockfile found at: ${this.lockfilePath}`);
			return;
		}

		console.log(`🗑️  Deleting lockfile at: ${this.lockfilePath}...`);
		try {
			await fs.promises.unlink(this.lockfilePath);
			console.log('✅ Lockfile deleted successfully.');
		} catch (error) {
			console.error(`❌ Failed to delete lockfile: ${error.message}`);
		}
	}
}

// CLI interface
async function main() {
	const cleaner = new PnpmLockfileCleaner();
	await cleaner.clean();
}

// Run the script
main().catch((error) => {
	console.error('❌ Unexpected error:', error.message);
	process.exit(1);
});

export default PnpmLockfileCleaner;
