import { setOutput } from '@actions/core';
import { createLunaria } from '@lunariajs/core';

await setDiscordMessage();

async function setDiscordMessage() {
	const lunaria = await createLunaria();
	const status = await lunaria.getFullStatus();
	const allLanguages = [lunaria.config.sourceLocale, ...lunaria.config.locales].map((l) => l.lang);
	const githubLinks = lunaria.gitHostingLinks();

	if (!status) return;

	const toTranslate = status.filter(
		(s) =>
			new Date(s.source.git.latestTrackedChange.date) >
			new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
	);

	const list = toTranslate
		.filter(
			(s) =>
				s.localizations.filter((localization) => {
					return localization.status === 'missing' || localization.status === 'outdated';
				}).length > 0
		)
		.map((s) => {
			const outdatedLangs = s.localizations
				.filter((localization) => {
					return localization.status === 'missing' || localization.status === 'outdated';
				})
				.map((localization) => localization.lang);

			const langs = outdatedLangs.length === allLanguages.length - 1 ? ['all'] : outdatedLangs;
			return `- [\`${s.source.path}\`](<${githubLinks.source(s.source.path)}>) (${
				langs[0] === 'all'
					? 'all'
					: langs
							.filter((lang) => {
								if (lang === 'en') return false;
								const localization = s.localizations.find((l) => l.lang === lang);
								return localization?.status === 'missing' || localization?.status === 'outdated';
							})
							.join(', ')
			})`;
		})
		.join('\n');

	let message = '**Weekly Translation Report Ready!** <@&1311284611799846942>';

	let embedMessage = `We have ${Object.keys(toTranslate).length} pages with major changes since last week. Please help us translate these pages to your language!\n\n${list}`;

	const embeds = [
		{
			id: 661098315,
			description: `We have ${Object.keys(toTranslate).length} pages with major changes since last week. Please help us translate these pages to your language!\n\n${list}`,
			fields: [],
			author: {
				name: 'Translation Report',
				icon_url:
					'https://github.com/withstudiocms/studiocms.dev/blob/main/assets/logo-discord.png?raw=true',
			},
			title: 'Translation Report',
		},
	];

	const suffix =
		'\n\nSee our [Translation Status page](<https://i18n.docs.studiocms.dev>) for more, including open PRs.';

	// Keep the entire message including the suffix within Discord's limits
	const maxLengthWithoutSuffix = 2000 - suffix.length;
	while (message.length > maxLengthWithoutSuffix) {
		const lastNewline = message.lastIndexOf('\n', maxLengthWithoutSuffix);
		message = message.slice(0, lastNewline);
	}
	while (embedMessage.length > maxLengthWithoutSuffix) {
		const lastNewline = embedMessage.lastIndexOf('\n', maxLengthWithoutSuffix);
		embedMessage = embedMessage.slice(0, lastNewline);
	}

	embedMessage += suffix;

	setOutput('DISCORD_MESSAGE', message);
	setOutput('DISCORD_MESSAGE_EMBEDS', JSON.stringify(embeds));
}
