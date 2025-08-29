#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { get } from 'node:https';

const BLOCKLIST_URL =
	'https://raw.githubusercontent.com/marteinn/The-Big-Username-Blocklist/main/list.txt';
const OUTPUT_FILE = './src/utils/lists/usernames.ts';

/**
 * Downloads content from a URL
 * @param {string} url - The URL to download from
 * @returns {Promise<string>} The downloaded content
 */
function downloadContent(url) {
	return new Promise((resolve, reject) => {
		get(url, (response) => {
			if (response.statusCode !== 200) {
				reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
				return;
			}

			let data = '';
			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				resolve(data);
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}

/**
 * Processes the blocklist content and generates TypeScript code
 * @param {string} content - Raw blocklist content
 * @returns {string} Generated TypeScript code
 */
function generateTypeScriptCode(content) {
	// Split by lines and clean up
	const usernames = content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#')) // Remove empty lines and comments
		.sort(); // Sort alphabetically for consistency

	const timestamp = new Date().toISOString();

	// Generate the TypeScript file content
	const tsContent = `// Auto-generated username blocklist
// Generated on: ${timestamp}
// Source: ${BLOCKLIST_URL}
// Total blocked usernames: ${usernames.length}

export const usernames = new Set<string>([
${usernames.map((username) => `  "${username}"`).join(',\n')}
]);

export default usernames;

// Canonicalize usernames for stable comparisons.
const canonicalizeUsername = (name: string): string =>
	(name ?? '').trim().normalize('NFKC').toLowerCase();

// Prefer using this predicate to avoid exposing the mutable Set.
export const isReservedUsername = (name: string): boolean => {
	const normalized = canonicalizeUsername(name);
	return usernames.has(normalized);
};
`;

	return tsContent;
}

/**
 * Main function to download and update the usernames file
 */
async function updateUsernameBlocklist() {
	try {
		console.log('📥 Downloading username blocklist...');
		const content = await downloadContent(BLOCKLIST_URL);

		console.log('🔄 Processing blocklist...');
		const tsCode = generateTypeScriptCode(content);

		console.log(`💾 Writing to ${OUTPUT_FILE}...`);
		writeFileSync(OUTPUT_FILE, tsCode, 'utf8');

		const lineCount = content
			.split('\n')
			.filter((line) => line.trim() && !line.startsWith('#')).length;
		console.log(`✅ Successfully updated ${OUTPUT_FILE} with ${lineCount} blocked usernames`);
	} catch (error) {
		console.error('❌ Error updating username blocklist:', error.message);
		process.exit(1);
	}
}

updateUsernameBlocklist();

export default { updateUsernameBlocklist, downloadContent, generateTypeScriptCode };
