import DTSBuilder from '@matthiesenxyz/astrodtsbuilder';
import { createResolver } from 'astro-integration-kit';

const { resolve } = createResolver(import.meta.url);

const dtsFile = DTSBuilder();

dtsFile.addSingleLineNote(
	'This file is generated by StudioCMS and should not be modified manually.'
);

dtsFile.addModule('studiocms-dashboard:web-vitals', {
	namedExports: [
		{
			name: 'getWebVitals',
			multiLineDescription: [
				'# Web Vitals Helper Function',
				'',
				'@returns Promise<WebVitalsResponseItem[]>',
			],
			typeDef: `typeof import('${resolve('../lib/webVitals/webVital.js')}').getWebVitals`,
		},
		{
			name: 'getWebVitalsRouteSummaries',
			typeDef: `typeof import('${resolve('../lib/webVitals/webVital.js')}').getWebVitalsRouteSummaries`,
		},
		{
			name: 'getWebVitalsSummary',
			typeDef: `typeof import('${resolve('../lib/webVitals/webVital.js')}').getWebVitalsSummary`,
		},
	],
	typeExports: [
		{
			singleLineDescription: 'Web Vitals Response Item',
			typeDef: `import('${resolve('../lib/webVitals/webVital.js')}').WebVitalsResponseItem`,
			name: 'WebVitalsResponseItem',
		},
	],
});

const webVitalDtsFile = dtsFile.makeAstroInjectedType('web-vitals.d.ts');

export default webVitalDtsFile;
