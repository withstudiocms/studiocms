#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { get } from 'node:https';

const BLOCKLIST_URL =
	'https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Passwords/Common-Credentials/10k-most-common.txt';
const OUTPUT_FILE = './src/utils/lists/passwords.ts';

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
 * Processes the password list content and generates TypeScript code
 * @param {string} content - Raw password list content
 * @returns {string} Generated TypeScript code
 */
function generateTypeScriptCode(content) {
	// Split by lines and clean up
	const passwords = content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#')) // Remove empty lines and comments
		.filter((password, index, arr) => arr.indexOf(password) === index) // Remove duplicates
		.sort(); // Sort alphabetically for consistency

	const timestamp = new Date().toISOString();

	// Generate the TypeScript file content
	const tsContent = `// Auto-generated common password blocklist
// Generated on: ${timestamp}
// Source: ${BLOCKLIST_URL}
// Total blocked passwords: ${passwords.length}

/**
 * Set of common passwords that should be blocked for security reasons.
 * This list contains the most commonly used passwords from various data breaches.
 * 
 * Usage:
 * import { blockedPasswords } from './passwords';
 * 
 * const isPasswordBlocked = blockedPasswords.has(userPassword.toLowerCase());
 */
export const passwords = new Set<string>([
${passwords.map((password) => `  "${password.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',\n')}
]);

/**
 * Check if a password is in the blocked list (case-insensitive)
 * @param pass - The password to check
 * @returns true if the password is blocked, false otherwise
 */
export const isReservedPassword = (pass: string): boolean => passwords.has(pass.toLowerCase());

export default passwords;
`;

	return tsContent;
}

/**
 * Main function to download and update the passwords file
 */
async function updatePasswordBlocklist() {
	try {
		console.log('📥 Downloading common passwords list...');
		const content = await downloadContent(BLOCKLIST_URL);

		console.log('🔄 Processing password list...');
		const tsCode = generateTypeScriptCode(content);

		console.log(`💾 Writing to ${OUTPUT_FILE}...`);
		writeFileSync(OUTPUT_FILE, tsCode, 'utf8');

		const lineCount = content
			.split('\n')
			.filter((line) => line.trim() && !line.startsWith('#')).length;
		console.log(`✅ Successfully updated ${OUTPUT_FILE} with ${lineCount} blocked passwords`);
		console.log(
			'⚠️  Remember: This file contains sensitive data - consider adding it to .gitignore'
		);
	} catch (error) {
		console.error('❌ Error updating password blocklist:', error.message);
		process.exit(1);
	}
}

// Run the script if called directly
updatePasswordBlocklist();

export default { updatePasswordBlocklist, downloadContent, generateTypeScriptCode };
