// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any.
export type ComponentType = Record<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: this is a valid use case for explicit any.
export type AstroProps = Record<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: This is a valid use case for explicit any.
export type AstroComponentChildren = { value: any };

/**
 * Represents a JSDoc tag with its name and optional text content.
 *
 * @property tagName - The name of the JSDoc tag (e.g., 'param', 'returns').
 * @property text - Optional text associated with the tag, such as a description or type.
 */
export interface JSDocTag {
	tagName: string;
	text?: string;
	name?: string; // For 'param' tags, this is the parameter name
	type?: string; // For 'param' tags, this is the type of the parameter
}

/**
 * Represents a property of an Astro component.
 *
 * @property name - The name of the property.
 * @property type - The type of the property as a string.
 * @property optional - Indicates whether the property is optional.
 * @property description - An optional description of the property.
 * @property defaultValue - An optional default value for the property.
 */
export interface AstroComponentProp {
	readonly name: string;
	readonly type: string;
	readonly optional: boolean;
	readonly description?: string;
	readonly defaultValue?: string;
	readonly jsDocTags?: JSDocTag[];
}

/**
 * Represents the properties of an Astro component.
 *
 * @property name - The unique name of the Astro component.
 * @property props - A readonly array of properties (`AstroComponentProp`) associated with the component.
 */
export interface AstroComponentProps {
	readonly name: string;
	readonly props: ReadonlyArray<AstroComponentProp>;
}

/**
 * Represents an entry in the component registry.
 *
 * Extends the `AstroComponentProps` interface to include additional metadata.
 *
 * @property safeName - A readonly string representing a safe, unique identifier for the component.
 */
export interface ComponentRegistryEntry extends AstroComponentProps {
	readonly safeName: string;
}

/**
 * Represents the result of validating a set of properties.
 *
 * @property valid - Indicates whether the validation was successful.
 * @property errors - A readonly array of error messages describing validation failures.
 */
export interface PropValidationResult {
	readonly valid: boolean;
	readonly errors: ReadonlyArray<string>;
}
