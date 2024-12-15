import { runtimeLogger } from '@inox-tools/runtime-logger';
import { integrationLogger } from '@matthiesenxyz/integration-utils/astroUtils';
import { stringify } from '@studiocms/core/lib';
import type { StudioCMSRendererConfig } from '@studiocms/core/schemas/renderer';
import { addVirtualImports, defineUtility } from 'astro-integration-kit';

type ConfigSetupOptions = {
	options: StudioCMSRendererConfig;
	verbose: boolean;
	RendererComponent: string;
	pkgName: string;
};

export const configSetup = defineUtility('astro:config:setup')(
	(params, { verbose, options, RendererComponent, pkgName }: ConfigSetupOptions) => {
		// Destructure the params
		const { logger, config } = params;

		// Log that Setup is Starting
		integrationLogger({ logger, logLevel: 'info', verbose }, 'Setting up StudioCMS Renderer...');
		// Setup the runtime logger
		runtimeLogger(params, { name: 'studiocms-renderer' });

		// Add Virtual Imports
		addVirtualImports(params, {
			name: pkgName,
			imports: {
				'studiocms:renderer': `export { default as StudioCMSRenderer } from '${RendererComponent}';`,
				'studiocms:renderer/config': `export default ${stringify(options)}`,
				'studiocms:renderer/astroMarkdownConfig': `export default ${stringify(config.markdown)}`,
			},
		});
		integrationLogger(
			{ logger, logLevel: 'info', verbose },
			'StudioCMS Renderer Virtual Imports Added...'
		);
	}
);

export default configSetup;
