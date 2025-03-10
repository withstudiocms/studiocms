import DTSBuilder from '@matthiesenxyz/astrodtsbuilder';
import { createResolver } from 'astro-integration-kit';

// Create resolver relative to this file
const { resolve } = createResolver(import.meta.url);

const rendererConfig = DTSBuilder();

rendererConfig.addSingleLineNote(
	'This file is generated by StudioCMS and should not be modified manually.'
);

rendererConfig.addModule('studiocms:renderer/config', {
	defaultExport: {
		singleLineDescription: 'Renderer Configuration',
		typeDef: `import('${resolve('../schemas/config/rendererConfig.js')}').StudioCMSRendererConfig`,
	},
});

const rendererConfigDTS = rendererConfig.makeAstroInjectedType('config.d.ts');

export default rendererConfigDTS;
