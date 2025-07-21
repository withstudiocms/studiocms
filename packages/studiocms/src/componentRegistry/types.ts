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
 * Represents the result of validating a set of properties.
 *
 * @property valid - Indicates whether the validation was successful.
 * @property errors - A readonly array of error messages describing validation failures.
 */
export interface PropValidationResult {
	readonly valid: boolean;
	readonly errors: ReadonlyArray<string>;
}
