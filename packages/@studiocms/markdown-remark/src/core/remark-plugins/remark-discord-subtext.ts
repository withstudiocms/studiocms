import { escape as escapeHTML } from 'html-escaper';
import type { Root } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';

/**
 * Remark plugin to transform Discord subtext syntax into HTML. This plugin looks for lines that start with `-# ` and wraps the following text in a `<small>` HTML tag, allowing for subtext styling in markdown content. The plugin uses a regular expression to identify the subtext syntax and replaces it with the appropriate HTML structure in the markdown abstract syntax tree (AST).
 *
 * @returns A transformer function that processes the markdown AST and applies the subtext transformation.
 */
const discordSubtextRegex = /^-# (.*)/;

/**
 * A remark plugin to transform markdown subtext syntax into HTML.
 *
 * This plugin searches for lines starting with `-# ` and wraps the
 * following text in a `<small>` HTML tag.
 *
 * @returns A transformer function that processes the markdown AST.
 */
export const remarkDiscordSubtext =
	() =>
	(tree: Root): void =>
		findAndReplace(tree, [
			discordSubtextRegex,
			(_, $1) => ({ type: 'html', value: `<small>${escapeHTML($1)}</small>` }),
		]);
