import type { DefaultCallouts } from '../types.ts';

// Color schemes for the Obsidian theme, defined as tuples to allow for different colors for the indicator and the title. These colors are used to style the callouts in a way that matches the Obsidian aesthetic, providing a visually appealing and consistent design for callouts in markdown content. Each color scheme corresponds to a specific callout type, allowing for easy identification and differentiation of callouts based on their visual appearance.
const commonColorsBlue: [string, string] = ['rgb(8, 109, 221)', 'rgb(2, 122, 255)'];
const commonColorsTeal: [string, string] = ['rgb(0, 191, 188)', 'rgb(83, 223, 221)'];
const commonColorsOrange: [string, string] = ['rgb(236, 117, 0)', 'rgb(233, 151, 63)'];
const commonColorsGreen: [string, string] = ['rgb(8, 185, 78)', 'rgb(68, 207, 110)'];
const commonColorsRed: [string, string] = ['rgb(233, 49, 71)', 'rgb(251, 70, 76)'];
const commonColorsPurple: [string, string] = ['rgb(120, 82, 238)', 'rgb(168, 130, 255)'];
const commonColorsGray = 'rgb(158, 158, 158)';

/**
 * SVG Icon for the "Check" callout type, representing a checkmark symbol. This icon is used to visually indicate that the content within the callout is correct or has been completed. The SVG consists of a checkmark shape, which is a common symbol for success or completion. This icon can be customized or replaced with a different SVG if desired, but it serves as a clear visual cue for check callouts in markdown content.
 */
const svgCheck =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

/**
 * SVG Icon for the "Tldr" callout type, which can be used to visually indicate a summary or abstract section in the markdown content. This icon is designed to match the aesthetic of the Obsidian theme and can be used as a default indicator for the "Tldr" callout type in the plugin's configuration.
 */
const svgTldr =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>';

/**
 * SVG Icon for the "Tip" callout type, representing a lightbulb symbol. This icon is used to visually indicate that the content within the callout is a helpful tip or suggestion for the reader. The SVG consists of a lightbulb shape, which is a common symbol for ideas and tips. This icon can be customized or replaced with a different SVG if desired, but it serves as a clear visual cue for tip callouts in markdown content.
 */
const svgTip =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>';

/**
 * SVG Icon for the "Cross" callout type, representing a cross symbol. This icon is used to visually indicate that the content within the callout is incorrect or should be avoided. The SVG consists of two diagonal lines crossing each other, which is a common symbol for errors or cancellations. This icon can be customized or replaced with a different SVG if desired, but it serves as a clear visual cue for cross callouts in markdown content.
 */
const svgCross =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

/**
 * SVG Icon for the "Warning" callout type, representing a warning symbol. This icon is used to visually indicate that the content within the callout is important and may require special attention from the reader. The SVG consists of a triangle with an exclamation mark inside, which is a common symbol for warnings and alerts. This icon can be customized or replaced with a different SVG if desired, but it serves as a clear visual cue for warning callouts in markdown content.
 */
const svgWarning =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

/**
 * SVG Icon for the "Help" callout type, which can be used to visually indicate a help or support section in the markdown content. This icon is designed to match the aesthetic of the Obsidian theme and can be used as a default indicator for the "Help" callout type in the plugin's configuration.
 */
const svgHelp =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';

/**
 * SVG Icon for the "Error" callout type, which can be used to visually indicate an error or issue in the markdown content. This icon is designed to match the aesthetic of the Obsidian theme and can be used as a default indicator for the "Error" callout type in the plugin's configuration.
 */
const svgError =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';

/**
 * SVG Icon for the "Cite" callout type, which can be used to visually indicate a citation or reference in the markdown content. This icon is designed to match the aesthetic of the Obsidian theme and can be used as a default indicator for the "Cite" callout type in the plugin's configuration.
 */
const svgCite =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>';

/**
 * Predefined callout theme based on Obsidian's callout styles. This theme includes a set of default callout types such as "note", "abstract", "summary", "tldr", and "info", each with its own title, indicator (SVG icon), and color scheme. The colors are defined as tuples to allow for different colors for the indicator and the title. This theme can be used as a base for styling callouts in markdown content, providing a visually appealing and consistent design that matches the Obsidian aesthetic.
 */
export const obsidianCallouts: DefaultCallouts = {
	note: {
		title: 'Note',
		indicator:
			'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"></path></svg>',
		color: commonColorsBlue,
	},
	abstract: {
		title: 'Abstract',
		indicator: svgTldr,
		color: commonColorsTeal,
	},
	summary: {
		title: 'Summary',
		indicator: svgTldr,
		color: commonColorsTeal,
	},
	tldr: {
		title: 'Tldr',
		indicator: svgTldr,
		color: commonColorsTeal,
	},
	info: {
		title: 'Info',
		indicator:
			'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
		color: commonColorsBlue,
	},
	todo: {
		title: 'Todo',
		indicator:
			'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
		color: commonColorsBlue,
	},
	tip: {
		title: 'Tip',
		indicator: svgTip,
		color: commonColorsTeal,
	},
	hint: {
		title: 'Hint',
		indicator: svgTip,
		color: commonColorsTeal,
	},
	important: {
		title: 'Important',
		indicator: svgTip,
		color: commonColorsTeal,
	},
	success: {
		title: 'Success',
		indicator: svgCheck,
		color: commonColorsGreen,
	},
	check: {
		title: 'Check',
		indicator: svgCheck,
		color: commonColorsGreen,
	},
	done: {
		title: 'Done',
		indicator: svgCheck,
		color: commonColorsGreen,
	},
	question: {
		title: 'Question',
		indicator: svgHelp,
		color: commonColorsOrange,
	},
	help: {
		title: 'Help',
		indicator: svgHelp,
		color: commonColorsOrange,
	},
	faq: {
		title: 'Faq',
		indicator: svgHelp,
		color: commonColorsOrange,
	},
	warning: {
		title: 'Warning',
		indicator: svgWarning,
		color: commonColorsOrange,
	},
	attention: {
		title: 'Attention',
		indicator: svgWarning,
		color: commonColorsOrange,
	},
	caution: {
		title: 'Caution',
		indicator: svgWarning,
		color: commonColorsOrange,
	},
	failure: {
		title: 'Failure',
		indicator: svgCross,
		color: commonColorsRed,
	},
	missing: {
		title: 'Missing',
		indicator: svgCross,
		color: commonColorsRed,
	},
	fail: {
		title: 'Fail',
		indicator: svgCross,
		color: commonColorsRed,
	},
	danger: {
		title: 'Danger',
		indicator: svgError,
		color: commonColorsRed,
	},
	error: {
		title: 'Error',
		indicator: svgError,
		color: commonColorsRed,
	},
	bug: {
		title: 'Bug',
		indicator:
			'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path><path d="m10 4 1 2"></path><path d="m14 4-1 2"></path></svg>',
		color: commonColorsRed,
	},
	example: {
		title: 'Example',
		indicator:
			'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
		color: commonColorsPurple,
	},
	quote: {
		title: 'Quote',
		indicator: svgCite,
		color: commonColorsGray,
	},
	cite: {
		title: 'Cite',
		indicator: svgCite,
		color: commonColorsGray,
	},
};
