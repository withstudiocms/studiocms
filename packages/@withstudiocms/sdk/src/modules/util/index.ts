import { Effect } from '@withstudiocms/effect';
import { SDKGenerators as Generators } from './generators.js';
import { GetVersionFromNPM } from './getVersionFromNPM.js';

export const SDKUtilModule = Effect.all({
	Generators,
	GetVersionFromNPM,
});
