import type { Element, ElementContent } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { h } from 'hastscript';
import { githubCallouts } from './themes/github.config.ts';
import { obsidianCallouts } from './themes/obsidian.config.ts';
import { vitepressCallouts } from './themes/vitepress.config.ts';
import type { Callouts, ConfigOptions, UserOptions } from './types.ts';

/**
 * Regular expression to match callout syntax in markdown. This regex captures the callout type, whether the callout is collapsible (indicated by a '+' or '-' sign), and the title of the callout. The regex is designed to match lines that start with `[!`, followed by the callout type, an optional collapsibility indicator, and then the title of the callout. This allows for flexible parsing of callouts in markdown content, enabling support for various callout types and configurations based on user-defined options.
 */
export const calloutRegex = /\[!(?<type>\w+)](?<collapsable>[+-]?)\s*(?<title>.*)/g;

/**
 * Regular expression to split the content of a callout into title and body based on the first newline character. The regex captures the prefix (title) and suffix (body) of the callout content, allowing for proper handling of callouts that have a title followed by content on a new line. This is particularly useful for ensuring that the callout's title is correctly identified and separated from its body content when processing the markdown AST.
 */
export const splitByNewlineRegex = /(?<prefix>[^\n]*)\n(?<suffix>[\S\s]*)/g;

/**
 * Predefined callout themes. Each theme contains a set of callout types with their corresponding indicators and styles. These themes can be used as a base for styling callouts in markdown content, and users can also customize them by providing their own callout configurations. The themes include popular styles such as GitHub, Obsidian, and VitePress, allowing for consistent and visually appealing callouts that match the overall design of the markdown content.
 */
export const themes = {
	github: githubCallouts,
	obsidian: obsidianCallouts,
	vitepress: vitepressCallouts,
};

/**
 * Converts a property keys of the object to lowercase.
 *
 * @param {Record<string, any>} object
 *   The object whose keys are to be converted to lowercase.
 * @returns {Record<string, any>}
 *   A new object with all keys converted to lowercase.
 */
function convertKeysToLowercase<T>(object: Record<string, T>): Record<string, T> {
	const newObject: Record<string, T> = {};
	for (const key of Object.keys(object)) {
		newObject[key.toLowerCase()] = object[key];
	}

	return newObject;
}

/**
 * Constructs the configuration.
 *
 * @param {(userOptions | undefined)} userOptions
 *   Optional user-specific settings to override defaults.
 * @returns {configOptions}
 *   The complete configuration object.
 */
export function getConfig(userOptions: UserOptions | undefined): ConfigOptions {
	const defaultOptions: ConfigOptions = {
		theme: 'obsidian',
		callouts: themes.obsidian,
		aliases: {},
		showIndicator: true,
		htmlTagNames: {
			nonCollapsibleContainerTagName: 'div',
			nonCollapsibleTitleTagName: 'div',
			nonCollapsibleContentTagName: 'div',
			collapsibleContentTagName: 'div',
			iconTagName: 'div',
			titleInnerTagName: 'div',
		},
	};

	if (userOptions) {
		const { theme, callouts, aliases } = userOptions;
		if (callouts) userOptions.callouts = convertKeysToLowercase(callouts);
		if (aliases) userOptions.aliases = convertKeysToLowercase(aliases);

		const initCallouts = theme ? themes[theme] : themes.obsidian;
		const mergedCallouts = { ...initCallouts };
		if (userOptions.callouts) {
			for (const key of Object.keys(userOptions.callouts)) {
				mergedCallouts[key] = {
					...initCallouts[key],
					...userOptions.callouts[key],
				};
			}
		}

		return {
			theme: userOptions.theme ?? defaultOptions.theme,
			callouts: mergedCallouts,
			aliases: { ...defaultOptions.aliases, ...userOptions.aliases },
			showIndicator: userOptions.showIndicator ?? defaultOptions.showIndicator,
			htmlTagNames: {
				...defaultOptions.htmlTagNames,
				...userOptions.htmlTagNames,
			},
		};
	}

	return defaultOptions;
}

/**
 * Expands the original callouts object based on aliases.
 *
 * @param {Callouts} callouts
 *   The original callouts object.
 * @param {Record<string, string[]>} aliases
 *   An object mapping callout types to arrays of aliases.
 * @returns {Callouts}
 *   The expanded callouts object including both original and alias-mapped callouts.
 */
export function expandCallouts(callouts: Callouts, aliases: Record<string, string[]>): Callouts {
	const expandedCallouts: Callouts = JSON.parse(JSON.stringify(callouts)) as Callouts;

	for (const key in aliases) {
		if (callouts[key]) {
			const aliasList = aliases[key];
			const originalCallout = callouts[key];
			for (const alias of aliasList) {
				expandedCallouts[alias] = originalCallout;
			}
		}
	}

	return expandedCallouts;
}

/**
 * Cleanup due to double spaces after title in Markdown
 * being converted to <br> tags.
 *
 * @param {ElementContent[]} children
 *   The array of HTML element to process.
 * @returns {*}
 *   The new array with specified elements removed.
 */
export function handleBrAfterTitle(children: ElementContent[]): ElementContent[] {
	return children.filter((child) => {
		if (child.type === 'element' && child.tagName === 'br') {
			return false;
		}

		return true;
	});
}

/**
 * Finds the index of the first text node containing a newline.
 *
 * @param {ElementContent[]} children
 *   Array of HAST child nodes.
 * @returns {number}
 *   Index of the first text node with a newline, or -1 if none found.
 */
export function findFirstNewline(children: ElementContent[]): number {
	for (const [i, c] of children.entries()) {
		if (c.type === 'text' && c.value.includes('\n')) {
			return i;
		}
	}

	return -1;
}

/**
 * Generate CSS style strings.
 *
 * @export
 * @param {(undefined | string | [string, string])} color
 * @returns {string}
 *  CSS variable string used for callout.
 */
export function generateStyle(color: undefined | string | [string, string]): string {
	if (Array.isArray(color)) {
		return `--callout-color-light: ${color[0]}; --callout-color-dark: ${color[1]};`;
	}

	if (typeof color === 'string') {
		return `--callout-color-light: ${color}; --callout-color-dark: ${color};`;
	}

	return '--callout-color-light: #888; --callout-color-dark: #888;';
}

/**
 * Fetches a callout's visual indicator.
 *
 * @param {configOptions} callouts
 *   Configuration containing type-indicator mappings.
 * @param {string} type
 *   Callout type to fetch the indicator for.
 * @param {string} iconTagName
 *   Tag name for the icon container.
 * @returns {(Element | undefined)}
 *   SVG element or undefined if not found.
 */
export function getIndicator(
	callouts: Callouts,
	type: string,
	iconTagName: string
): Element | undefined {
	const indicator = callouts[type]?.indicator;
	if (!indicator) return;

	const indicatorElement = fromHtml(indicator, {
		space: 'svg',
		fragment: true,
	});

	return h(iconTagName, { className: 'callout-icon', ariaHidden: 'true' }, indicatorElement);
}

/**
 * Get fold icon when callout is collapsible.
 *
 * @param {string} iconTagName
 *   Tag name for the icon container.
 * @returns {Element}
 *   SVG element.
 */
export function getFoldIcon(iconTagName: string): Element {
	const icon =
		'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
	const foldIconElement = fromHtml(icon, {
		space: 'svg',
		fragment: true,
	});

	return h(iconTagName, { className: 'callout-fold', ariaHidden: 'true' }, foldIconElement);
}
