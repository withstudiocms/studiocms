import { execa } from 'execa';

/**
 * Checks if a changeset with the given summary already exists in the .changeset directory.
 *
 * Uses the `grep` command to search recursively for the summary string in the .changeset directory.
 * If a match is found, logs a message and returns true; otherwise, returns false.
 *
 * @async
 * @param {string} summary - The summary string to search for in changesets.
 * @returns {Promise<boolean>} - Resolves to true if the changeset exists, false otherwise.
 */
export default async function ensureChangeset(summary) {
	const res = await execa('grep', ['-R', '-F', '-q', summary, '.changeset'], { reject: false });
	if (res.exitCode === 0) {
		return true;
	}
	return false;
}
