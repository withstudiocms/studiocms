import { SDKCore } from 'studiocms:sdk';
import type { ProjectData } from 'grapesjs';
import { Effect, Schema } from 'studiocms/effect';

export interface StudioCMSProjectData extends ProjectData {
	__STUDIOCMS_HTML?: string;
}

export const effectSchema = Schema.Struct({
	__STUDIOCMS_HTML: Schema.optional(Schema.String),
});

export type EffectSchema = (typeof effectSchema)['fields'];

export const PLUGIN_ID = 'studiocms-wysiwyg';

export const UseSDK = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	const { usePluginData } = sdk.PLUGINS;

	const _getAllProjectData = yield* usePluginData<StudioCMSProjectData, EffectSchema>(PLUGIN_ID, {
		validator: { effectSchema },
	}).getEntries();

	return {};
});
