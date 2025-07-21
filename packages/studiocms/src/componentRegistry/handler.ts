import { addVirtualImports, createResolver, defineUtility } from 'astro-integration-kit';
import { Effect, convertToVanilla, genLogger } from '../effect.js';
import { integrationLogger } from '../utils/integrationLogger.js';
import { ComponentRegistry } from './Registry.js';
import { convertHyphensToUnderscores } from './convert-hyphens.js';
import type { AstroComponentProps, ComponentRegistryEntry } from './types.js';

type Options = {
	verbose: boolean;
	name: string;
	componentRegistry: Record<string, string>;
	astroConfigResolve: (...path: Array<string>) => string;
};

const { resolve } = createResolver(import.meta.url);

export const componentRegistryHandler = defineUtility('astro:config:setup')(
	async (params, { componentRegistry, astroConfigResolve, verbose, name }: Options) =>
		await convertToVanilla(
			genLogger('studiocms/componentRegistry/handler')(function* () {
				const logInfo = { logger: params.logger, logLevel: 'info' as const, verbose };
				integrationLogger(logInfo, 'Setting up component registry...');
				const registry = yield* ComponentRegistry;

				const componentKeys: string[] = [];
				const components: string[] = [];

				for (const [key, value] of Object.entries(componentRegistry)) {
					// Log the component key and value
					integrationLogger(logInfo, `Component "${key}" resolved to "${value}"`);

					// Check if the value is defined and is a string ending with .astro
					if (!value) {
						integrationLogger(logInfo, `Component "${key}" is not defined, skipping...`);
						continue;
					}

					if (typeof value !== 'string') {
						integrationLogger(logInfo, `Component "${key}" is not a string, skipping...`);
						continue;
					}

					if (!value.endsWith('.astro')) {
						integrationLogger(logInfo, `Component "${key}" does not end with .astro, skipping...`);
						continue;
					}

					// Resolve the path using astroConfigResolve
					integrationLogger(logInfo, `Resolving path for component "${key}"...`);

					const resolvedPath = astroConfigResolve(value);

					integrationLogger(logInfo, `Component "${key}" resolved path: "${resolvedPath}"`);

					// Check if the resolved path is empty
					if (!resolvedPath) {
						integrationLogger(logInfo, `Component "${key}" resolved path is empty, skipping...`);
						continue;
					}

					integrationLogger(logInfo, `Component "${key}" is valid and will be included.`);

					const keyName = key.toLowerCase();
					const safeKeyName = convertHyphensToUnderscores(keyName);

					// Add the component key and import statement
					componentKeys.push(safeKeyName);
					components.push(`export { default as ${safeKeyName} } from '${resolvedPath}';`);

					// Register the component in the registry
					yield* registry.registerComponentFromFile(resolvedPath, keyName);
				}

				integrationLogger(logInfo, `Total components found: ${componentKeys.length}`);

				integrationLogger(logInfo, 'Extracting component props...');
				const componentPropsMap: Map<string, AstroComponentProps> =
					yield* registry.getAllComponents();

				const componentProps: ComponentRegistryEntry[] = Array.from(
					componentPropsMap.entries()
				).map(([key, value]) => ({
					...value,
					name: key,
					safeName: convertHyphensToUnderscores(key),
				}));

				integrationLogger(logInfo, `Total component props extracted: ${componentProps.length}`);

				integrationLogger(logInfo, 'Component registry setup complete.');

				addVirtualImports(params, {
					name,
					imports: {
						'studiocms:component-registry': `
							export const componentKeys = ${JSON.stringify(componentKeys || [])};
							export const componentProps = ${JSON.stringify(componentProps) || []};
							${components.join('\n')}
						`,
						'studiocms:component-registry/runtime': `
							export * from '${resolve('./runtime.js')}';
						`
					},
				});
			}).pipe(Effect.provide(ComponentRegistry.Default))
		)
);
