import { setOutput } from '@actions/core';
import crowdin, {
	type ResponseList,
	type TranslationStatusModel,
	type Credentials,
} from '@crowdin/crowdin-api-client';

const { WORKFLOW_DISPATCH, CROWDIN_PROJECT_ID, CROWDIN_PERSONAL_TOKEN } = process.env;

await setDiscordMessage();

async function setDiscordMessage() {
	if (!CROWDIN_PERSONAL_TOKEN || !CROWDIN_PROJECT_ID) {
		const missing: string[] = [];
		if (!CROWDIN_PERSONAL_TOKEN) missing.push('CROWDIN_PERSONAL_TOKEN');
		if (!CROWDIN_PROJECT_ID) missing.push('CROWDIN_PROJECT_ID');
		throw new Error(`Missing environment variables: ${missing.join(', ')}`);
	}

	const PROJECT_ID = Number(CROWDIN_PROJECT_ID);

	// credentials
	const credentials: Credentials = {
		token: CROWDIN_PERSONAL_TOKEN,
	};

	// initialization of crowdin client
	// @ts-expect-error - Seems to me a module conversion issue? (using `tsm` to convert on-the-fly to JS)
	const { translationStatusApi } = new crowdin.default(credentials) as crowdin;

	let response: ResponseList<TranslationStatusModel.LanguageProgress>;

	try {
		response = await translationStatusApi.getProjectProgress(PROJECT_ID);
	} catch (e) {
		throw new Error(`Failed to fetch project progress from Crowdin: ${(e as Error).message}`);
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
