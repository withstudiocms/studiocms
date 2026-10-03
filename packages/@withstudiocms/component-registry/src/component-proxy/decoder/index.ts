import { type DecodingMode, decodeHTML, decodeXML } from './util.js';

/** The level of entities to support. */
export enum EntityLevel {
	/** Support only XML entities. */
	XML = 0,
	/** Support HTML entities, which are a superset of XML entities. */
	HTML = 1,
}

export interface DecodingOptions {
	/**
	 * The level of entities to support.
	 * @default {@link EntityLevel.XML}
	 */
	level?: EntityLevel;
	/**
	 * Decoding mode. If `Legacy`, will support legacy entities not terminated
	 * with a semicolon (`;`).
	 *
	 * Always `Strict` for XML. For HTML, set this to `true` if you are parsing
	 * an attribute value.
	 *
	 * The deprecated `decodeStrict` function defaults this to `Strict`.
	 *
	 * @default {@link DecodingMode.Legacy}
	 */
	mode?: DecodingMode | undefined;
}

/**
 * Decodes a string with entities.
 *
 * @param input String to decode.
 * @param options Decoding options.
 */
export function decode(
	input: string,
	options: DecodingOptions | EntityLevel = EntityLevel.XML
): string {
	const level = typeof options === 'number' ? options : options.level;

	if (level === EntityLevel.HTML) {
		const mode = typeof options === 'object' ? options.mode : undefined;
		return decodeHTML(input, mode);
	}

	return decodeXML(input);
}
