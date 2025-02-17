import type { InjectedType } from 'astro';
import authLibDTS from './auth-lib.js';
import authScriptsDTS from './auth-scripts.js';
import authUtilsDTS from './auth-utils.js';
import changelogDtsFileOutput from './changelog.js';
import componentsDtsFileOutput from './components.js';
import coreDtsFileOutput from './core.js';
import i18nDTSOutput from './i18n-dts.js';
import { getImagesDTS } from './images.js';
import libDtsFileOutput from './lib.js';
import pluginsDtsFileOutput from './plugins.js';
import getProxyDTS from './proxy.js';
import rendererConfigDTS from './renderer-config.js';
import rendererMarkdownConfigDTS from './renderer-markdownConfig.js';
import rendererDTS from './renderer.js';
import sdkDtsFile from './sdk.js';
import webVitalDtsFile from './webVitals.js';

export function getInjectedTypes(
	ComponentRegistry: Record<string, string>,
	imageComponentPath: string,
	astroConfigResolve: (...path: Array<string>) => string
) {
	const staticTypes: InjectedType[] = [
		changelogDtsFileOutput,
		componentsDtsFileOutput,
		coreDtsFileOutput,
		i18nDTSOutput,
		libDtsFileOutput,
		pluginsDtsFileOutput,
		sdkDtsFile,
		rendererDTS,
		rendererConfigDTS,
		rendererMarkdownConfigDTS,
		authLibDTS,
		authUtilsDTS,
		authScriptsDTS,
		webVitalDtsFile,
	];

	const proxyDTS = getProxyDTS(ComponentRegistry, astroConfigResolve);

	const imageDTS = getImagesDTS(imageComponentPath);

	return [...staticTypes, proxyDTS, imageDTS];
}
