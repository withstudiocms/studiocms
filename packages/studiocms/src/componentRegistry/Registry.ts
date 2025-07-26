import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import { Effect, genLogger } from '../effect.js';
import { PropsParser } from './PropsParser.js';
import { ComponentNotFoundError, ComponentRegistryError, FileParseError } from './errors.js';
import type { AstroComponentProps } from './types.js';

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
	dependencies: [PropsParser.Default, Path.layer, NodeFileSystem.layer],
	effect: genLogger('studiocms/componentRegistry/Registry')(function* () {
		const parser = yield* PropsParser;
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const components = new Map<string, AstroComponentProps>();

		return {
			registerComponentFromFile: (filePath: string, componentName?: string) =>
				genLogger('studiocms/componentRegistry/Registry.registerComponentFromFile')(function* () {
					const fileContent = yield* fs.readFileString(filePath);
					const propsDefinition = yield* parser.extractPropsFromAstroFile(fileContent).pipe(
						Effect.mapError(
							(error) =>
								new FileParseError({
									filePath,
									message: error.message,
									cause: error.cause,
								})
						)
					);

					const name = componentName || path.basename(filePath, path.extname(filePath));
					const parsed = yield* parser.parseComponentProps(propsDefinition).pipe(
						Effect.mapError(
							(error) =>
								new ComponentRegistryError({
									message: `Failed to register component ${name}`,
									cause: error,
								})
						)
					);

					if (parsed.length > 0) {
						components.set(name, parsed[0]);
					}
				}),

			getAllComponents: () => Effect.succeed(new Map(components)),

			getComponentProps: (componentName: string) =>
				genLogger('studiocms/componentRegistry/Registry.getComponentProps')(function* () {
					const component = components.get(componentName);
					if (!component) {
						yield* Effect.fail(new ComponentNotFoundError({ componentName }));
					}
					return component;
				}),

			validateProps: (componentName: string, props: Record<string, unknown>) =>
				genLogger('studiocms/componentRegistry/Registry.validateProps')(function* () {
					const component = components.get(componentName);
					if (!component) {
						yield* Effect.fail(new ComponentNotFoundError({ componentName }));
					}

					const errors: string[] = [];
					const providedProps = new Set(Object.keys(props));

					if (component) {
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
					}

					return { valid: errors.length === 0, errors };
				}),
		};
	}).pipe(
		Effect.provide(PropsParser.Default),
		Effect.provide(Path.layer),
		Effect.provide(NodeFileSystem.layer)
	),
}) {}