import { setOutput } from '@actions/core';
import crowdin from '@crowdin/crowdin-api-client';

const { WORKFLOW_DISPATCH, CROWDIN_PROJECT_ID, CROWDIN_PERSONAL_TOKEN } = process.env;

await setDiscordMessage();

async function setDiscordMessage() {
	if (!CROWDIN_PERSONAL_TOKEN || !CROWDIN_PROJECT_ID) {
		/** @type {string[]} */
		const missing = [];
		if (!CROWDIN_PERSONAL_TOKEN) missing.push('CROWDIN_PERSONAL_TOKEN');
		if (!CROWDIN_PROJECT_ID) missing.push('CROWDIN_PROJECT_ID');
		throw new Error(`Missing environment variables: ${missing.join(', ')}`);
	}

	const PROJECT_ID = Number(CROWDIN_PROJECT_ID);

	// credentials
	/** @type {import('@crowdin/crowdin-api-client').Credentials} */
	const credentials = {
		token: CROWDIN_PERSONAL_TOKEN,
	};

	// initialization of crowdin client
	const { translationStatusApi } = new crowdin.default(credentials);

	/** @type {import('@crowdin/crowdin-api-client').ResponseList<import('@crowdin/crowdin-api-client').TranslationStatusModel.LanguageProgress>} */
	let response;

	try {
		response = await translationStatusApi.getProjectProgress(PROJECT_ID);
	} catch (e) {
		throw new Error(`Failed to fetch project progress from Crowdin: ${e.message}`);
	}

	const remappedData = response.data.map(
		({
			data: {
				language: { id, name },
				translationProgress,
			},
		}) => ({
			id,
			name,
			translationProgress,
		})
	);

	let message = `**The Weekly translation report is here!** <@&1311284611799846942>${WORKFLOW_DISPATCH ? ' EARLY!!!' : ''}\n\n`;

	for (const lang of remappedData) {
		message += `- ${lang.name} (${lang.id}) - ${lang.translationProgress}% Complete\n`;
	}

	const suffix = '\n\nSee our [Translation Status page](<https://i18n.studiocms.dev>) for more.';

	const maxLengthWithoutSuffix = 2000 - suffix.length;

	// If message is too long, keep languages until we hit the limit
	if (message.length > maxLengthWithoutSuffix) {
		const lines = message.split('\n');
		message = `${lines[0]}\n${lines[1]}\n`;
		let currentLength = message.length;

		for (let i = 2; i < lines.length; i++) {
			const lineLength = lines[i].length + 1; // +1 for newline
			if (currentLength + lineLength <= maxLengthWithoutSuffix) {
				message += `${lines[i]}\n`;
				currentLength += lineLength;
			} else {
				message += '... and more languages (truncated due to length)';
				break;
			}
		}
	}

	message += suffix;

	setOutput('DISCORD_MESSAGE', message);
}
