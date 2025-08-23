import write from '@changesets/write';
import { execa } from 'execa';

async function run() {
	// Get the PR number from the CI environment
	const PR_NUMBER = process.env.CI_PULL_REQUEST_NUMBER;

	// If the PR number is not found, exit the process
	if (!PR_NUMBER) {
		console.log('No PR number found');
		process.exit(0);
	}

	// Changeset summary
	const summary = `chore(deps): Updated Effect dependencies (PR: #${PR_NUMBER})`;

	// Check if the changeset already exists

	// Run the grep command to check if the changeset already exists
	const { stdout } = await execa('grep', ['-R', '-F', summary, '.changeset'], { reject: false });

	// If the changeset already exists, exit the process
	if (stdout) {
		console.log('Changeset already exists');
		process.exit(0);
	}

	// Create a new changeset
	const changesetId = await write(
		{ summary, releases: [{ name: '@withstudiocms/effect', type: 'patch' }] },
		process.cwd()
	);

	// Log the changeset id
	console.log(`Changeset created: ${changesetId}`);
}

run();
