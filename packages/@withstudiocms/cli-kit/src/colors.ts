/**
 * @module @withstudiocms/cli-kit/colors
 *
 * Provides utility functions for styling terminal text with custom hexadecimal colors
 * using ANSI escape codes. Includes functions for both foreground and background colors,
 * as well as predefined color styles for StudioCMS themes.
 *
 * @example
 * ```ts
 * import { styleTextHex, styleTextBgHex, supportsColor, StudioCMSColorway } from '@withstudiocms/cli-kit/colors';
 *
 * const redText = styleTextHex('#FF0000')('This is red text');
 * const blueBgText = styleTextBgHex('#0000FF')('This text has a blue background');
 */

/**
 * Styles text with a custom hexadecimal color using ANSI escape codes.
 *
 * @param hexColor - The hexadecimal color code to apply (e.g., "#FF5733")
 * @param text - The text content to be styled
 * @param options - Optional configuration object
 * @param options.background - If true, applies the color to the background instead of foreground. Defaults to false
 * @returns The styled text string with ANSI escape codes for terminal output
 *
 * @example
 * ```typescript
 * // Red foreground text
 * const redText = styleTextCustomHex("#FF0000", "Hello World");
 *
 * // Blue background
 * const blueBackground = styleTextCustomHex("#0000FF", "Hello World", { background: true });
 * ```
 */
function styleTextCustomHex(
	hexColor: `#${string}`,
	text: string,
	options?: { background?: boolean }
): string {
	// Helper to convert hex to RGB
	const hexToRgb = (hex: `#${string}`) => {
		const bigint = Number.parseInt(hex.replace('#', ''), 16);
		const r = (bigint >> 16) & 255;
		const g = (bigint >> 8) & 255;
		const b = bigint & 255;
		return [r, g, b];
	};

	const [r, g, b] = hexToRgb(hexColor);
	// ANSI escape code for foreground (38;2) or background (48;2) 24-bit color
	const colorCode = options?.background ? 48 : 38;
	const colorStart = `\x1b[${colorCode};2;${r};${g};${b}m`;
	const colorReset = '\x1b[0m'; // Resets all styles

	return `${colorStart}${text}${colorReset}`;
}

/**
 * Creates a function that styles text with a specified hex color.
 *
 * @param hexColor - The hex color code to apply to the text (must start with '#')
 * @returns A function that takes a string and returns the styled text with the specified hex color
 *
 * @example
 * ```ts
 * const redText = styleTextHex('#FF0000');
 * console.log(redText('Hello')); // Returns 'Hello' styled in red
 * ```
 */
export const styleTextHex = (hexColor: `#${string}`) => (text: string) =>
	styleTextCustomHex(hexColor, text);

/**
 * Creates a function that styles text with a custom hexadecimal background color.
 *
 * @param hexColor - A hexadecimal color code string prefixed with '#' (e.g., '#FF5733')
 * @returns A function that takes a text string and returns it styled with the specified background color
 *
 * @example
 * ```ts
 * const bgRed = styleTextBgHex('#FF0000');
 * console.log(bgRed('Hello World')); // Text with red background
 * ```
 */
export const styleTextBgHex = (hexColor: `#${string}`) => (text: string) =>
	styleTextCustomHex(hexColor, text, { background: true });

/**
 * Indicates whether the current terminal supports color output.
 *
 * @remarks
 * This is determined by checking if stdout is a TTY (terminal) and has color support capabilities.
 * Returns `true` if both conditions are met, `false` otherwise.
 *
 * @example
 * ```ts
 * const greenStyler = styleTextHex('#00FF00');
 *
 * if (supportsColor) {
 *   const greenText = greenStyler('Green text');
 *   console.log(greenText);
 * } else {
 *   console.log('Plain text');
 * }
 * ```
 */
export const supportsColor = process.stdout.isTTY && process.stdout.hasColors();

/**
 * StudioCMS Primary Colorway
 */
export const StudioCMSColorway = styleTextHex('#a581f3');

/**
 * StudioCMS Primary Colorway Background
 */
export const StudioCMSColorwayBg = styleTextBgHex('#a581f3');

/**
 * StudioCMS Info Colorway
 */
export const StudioCMSColorwayInfo = styleTextHex('#22c55e');

/**
 * StudioCMS Info Colorway Background
 */
export const StudioCMSColorwayInfoBg = styleTextBgHex('#22c55e');

/**
 * StudioCMS Warn Colorway
 */
export const StudioCMSColorwayWarn = styleTextHex('#facc14');

/**
 * StudioCMS Warn Colorway Background
 */
export const StudioCMSColorwayWarnBg = styleTextBgHex('#facc14');

/**
 * StudioCMS Error Colorway
 */
export const StudioCMSColorwayError = styleTextHex('#bd0249');

/**
 * StudioCMS Error Colorway Background
 */
export const StudioCMSColorwayErrorBg = styleTextBgHex('#bd0249');

/**
 * Turso Colorway
 */
export const TursoColorway = styleTextBgHex('#4ff8d2');
