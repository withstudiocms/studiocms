import { Effect, Layer, Platform, PlatformNode } from '@withstudiocms/effect';
import { ComponentNotFoundError } from '../errors.js';
import type { AstroComponentProps } from '../types.js';
import { PropsParser } from './PropsParser.js';

const registryDeps = Layer.mergeAll(
	PropsParser.Default,
	Platform.Path.layer,
	PlatformNode.NodeFileSystem.layer
);

/**
 * A service class for registering, retrieving, and validating Astro component props.
 *
 * The `ComponentRegistry` provides methods to:
 * - Register a component and its props from an Astro file.
 * - Retrieve the props definition for a registered component.
 * - List all registered components and their props.
 * - Validate a set of props against a registered component's prop definition.
 *
 * Dependencies:
 * - `PropsParser.Default`: Used to extract and parse props from Astro files.
 * - `Path.layer`: Used for file path operations.
 * - `NodeFileSystem.layer`: Used for reading files from the filesystem.
 *
 * Methods:
 * - `registerComponentFromFile(filePath: string, componentName?: string)`: Registers a component by reading and parsing its props from the specified Astro file.
 * - `getComponentProps(componentName: string)`: Retrieves the props definition for the specified component.
 * - `getAllComponents()`: Returns a map of all registered components and their props.
 * - `validateProps(componentName: string, props: Record<string, unknown>)`: Validates the provided props against the registered component's prop definition, checking for missing required props and unknown props.
 *
 * Errors:
 * - Throws `FileParseError` if the Astro file cannot be parsed.
 * - Throws `ComponentRegistryError` if registration fails.
 * - Throws `ComponentNotFoundError` if a requested component is not registered.
 */
export class ComponentRegistry extends Effect.Service<ComponentRegistry>()('ComponentRegistry', {
	dependencies: [PropsParser.Default, Platform.Path.layer, PlatformNode.NodeFileSystem.layer],
	effect: Effect.gen(function* () {
		// Get dependencies
		const [parser, fs, path] = yield* Effect.all([
			PropsParser,
			Platform.FileSystem.FileSystem,
			Platform.Path.Path,
		]);

		// Internal storage for registered components
		const components = new Map<string, AstroComponentProps>();

		/**
		 * Registers a component definition by reading and parsing an Astro component file and storing its parsed props metadata.
		 *
		 * This function returns an Effect that:
		 * 1. Reads the file at `filePath`.
		 * 2. Extracts prop declarations from the Astro file AST.
		 * 3. Parses the extracted prop declarations into a structured representation.
		 * 4. If one or more parsed component definitions are returned, stores the first parsed definition in the internal `components` map
		 *    using `componentName` if provided, otherwise using the file's basename (filename without extension).
		 *
		 * Key details:
		 * - Parameters:
		 *   - filePath: The filesystem path to the Astro component file to read and parse.
		 *   - componentName: Optional override for the component name to use as the key when registering. If omitted, the file's basename is used.
		 * - Side effects:
		 *   - Mutates an internal `components` map by setting the resolved component metadata keyed by the chosen name.
		 * - Behavior:
		 *   - Only the first parsed component definition (parsed[0]) is stored, even if multiple definitions are parsed.
		 * - Errors:
		 *   - If reading the file or parsing fails, the returned Effect will fail with the corresponding error.
		 * - Return:
		 *   - An Effect that resolves when registration completes (no meaningful return value on success).
		 *
		 * Example:
		 * // Effect will attempt to read and register the component at "./src/components/Button.astro"
		 * // _registerComponentFromFile("./src/components/Button.astro", "Button")
		 *
		 * @param filePath - Path to the Astro file to read and parse.
		 * @param componentName - Optional name to register the component under (defaults to the file basename).
		 * @returns An Effect that performs the registration and resolves on success or fails with an error.
		 *
		 * @internal
		 */
		const _registerComponentFromFile = Effect.fn((filePath: string, componentName?: string) =>
			fs.readFileString(filePath).pipe(
				Effect.flatMap(parser.extractPropsFromAstroFile),
				Effect.flatMap(parser.parseComponentProps),
				Effect.map((parsed) => {
					const name = componentName || path.basename(filePath, path.extname(filePath));
					const component = parsed[0] ?? {
						name,
						props: [] as AstroComponentProps['props'],
					};
					components.set(name, component);
				})
			)
		);

		/**
		 * Retrieve all registered components and their props.
		 */
		const _getAllComponents = Effect.fn(() => Effect.succeed(new Map(components)));

		/**
		 * Retrieve the props definition for a specific component by name.
		 *
		 * @param componentName - The name of the component to retrieve.
		 * @returns An Effect that resolves to the component's props definition or fails if not found.
		 */
		const _getComponentProps = Effect.fn(function* (componentName: string) {
			const component = components.get(componentName);
			if (!component) {
				return yield* new ComponentNotFoundError({ componentName });
			}
			return component;
		});

		/**
		 * Validate the props provided for a registered component.
		 *
		 * Performs two checks:
		 *  - Ensures all required props declared on the component (where `optional === false`)
		 *    are present in the provided `props`.
		 *  - Flags any provided prop keys that are not declared on the component as unknown.
		 *
		 * This function is implemented as an Effect generator that fetches component metadata
		 * (via an internal `_getComponentProps` call) before performing validation.
		 *
		 * @param componentName - The name of the component whose props should be validated.
		 * @param props - A record of prop names to values to validate against the component's prop schema.
		 * @returns An object with:
		 *  - `valid`: `true` when no validation errors were found, otherwise `false`.
		 *  - `errors`: An array of descriptive error messages for missing required props and unknown props.
		 */
		const _validateProps = Effect.fn(function* (
			componentName: string,
			props: Record<string, unknown>
		) {
			const component = yield* _getComponentProps(componentName);

			const errors: string[] = [];
			const providedProps = new Set(Object.keys(props));

			// Check required props
			for (const prop of component.props) {
				if (!prop.optional && !providedProps.has(prop.name)) {
					errors.push(`Required prop "${prop.name}" is missing`);
				}
			}

			// Check for unknown props
			const validPropNames = new Set(component.props.map((p) => p.name));
			for (const propName of providedProps) {
				if (!validPropNames.has(propName)) {
					errors.push(`Unknown prop "${propName}"`);
				}
			}

			return { valid: errors.length === 0, errors };
		});

		return {
			registerComponentFromFile: _registerComponentFromFile,
			getAllComponents: _getAllComponents,
			getComponentProps: _getComponentProps,
			validateProps: _validateProps,
		};
	}).pipe(Effect.provide(registryDeps)),
}) {}
