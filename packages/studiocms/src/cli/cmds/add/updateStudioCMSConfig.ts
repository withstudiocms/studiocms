import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { askToContinue } from '@withstudiocms/cli-kit/messages';
import boxen from 'boxen';
import color from 'chalk';
import { diffWords } from 'diff';
import { type ProxifiedModule, generateCode } from 'magicast';
import { type ClackPrompts, type Logger, UpdateResult } from './utils.js';

export async function updateStudioCMSConfig({
	configURL,
	logger,
	mod,
	p,
}: {
	configURL: URL;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	mod: ProxifiedModule<any>;
	logger: Logger;
	p: ClackPrompts;
}): Promise<UpdateResult> {
	const input = await fs.readFile(fileURLToPath(configURL), { encoding: 'utf-8' });
	const output = generateCode(mod, {
		format: {
			objectCurlySpacing: true,
			useTabs: false,
			tabWidth: 2,
		},
	}).code;

	if (input === output) return UpdateResult.none;

	const diff = getDiffContent(input, output);

	if (!diff) return UpdateResult.none;

	const message = `\n${boxen(diff, {
		margin: 0.5,
		padding: 0.5,
		borderStyle: 'round',
		title: configURL.pathname.split('/').pop(),
	})}\n`;

	p.note(
		`\n ${color.magenta('StudioCMS will make the following changes to your config file:')}\n${message}`
	);

	if (await askToContinue(p)) {
		await fs.writeFile(fileURLToPath(configURL), output, { encoding: 'utf-8' });
		logger.debug('Updated studiocms config');
		return UpdateResult.updated;
	}
	return UpdateResult.cancelled;
}

function getDiffContent(input: string, output: string): string | null {
	const changes = [];
	for (const change of diffWords(input, output)) {
		const lines = change.value.trim().split('\n').slice(0, change.count);
		if (lines.length === 0) continue;
		if (change.added) {
			if (!change.value.trim()) continue;
			changes.push(change.value);
		}
	}
	if (changes.length === 0) {
		return null;
	}

	let diffed = output;
	for (const newContent of changes) {
		const coloredOutput = newContent
			.split('\n')
			.map((ln) => (ln ? color.green(ln) : ''))
			.join('\n');
		diffed = diffed.replace(newContent, coloredOutput);
	}

	return diffed;
}
