import { Data } from '../effect.js';

/**
 * Error class representing issues related to the component registry.
 *
 * @remarks
 * This error extends a tagged error type with the tag `'ComponentRegistryError'`.
 *
 * @example
 * ```typescript
 * throw new ComponentRegistryError({ message: "Component not found" });
 * ```
 *
 * @property message - A descriptive error message.
 * @property cause - (Optional) The underlying cause of the error, if any.
 */
export class ComponentRegistryError extends Data.TaggedError('ComponentRegistryError')<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when a file fails to parse.
 *
 * @remarks
 * This error extends a tagged error type with the tag 'FileParseError'.
 *
 * @example
 * ```typescript
 * throw new FileParseError({ filePath: '/path/to/file', message: 'Invalid format' });
 * ```
 *
 * @property filePath - The path of the file that failed to parse.
 * @property message - A descriptive error message.
 * @property cause - (Optional) The underlying cause of the error, if available.
 */
export class FileParseError extends Data.TaggedError('FileParseError')<{
	readonly filePath: string;
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when a requested component cannot be found in the registry.
 *
 * @remarks
 * This error extends a tagged error type with the tag 'ComponentNotFoundError'.
 *
 * @example
 * ```typescript
 * throw new ComponentNotFoundError({ componentName: 'MyComponent' });
 * ```
 *
 * @property componentName - The name of the component that was not found.
 */
export class ComponentNotFoundError extends Data.TaggedError('ComponentNotFoundError')<{
	readonly componentName: string;
}> {}
