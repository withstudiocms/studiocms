import { SDKCore } from 'studiocms:sdk';
import type { ProjectData } from 'grapesjs';
import { Effect, Schema } from 'studiocms/effect';

// this is used for testing, and is planned to be used in the future

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

	const _usePluginDataCategory = () =>
		usePluginData<StudioCMSProjectData, EffectSchema>(PLUGIN_ID, {
			validator: { effectSchema },
		});

	const _usePluginDataSingle = (id: string) =>
		usePluginData<StudioCMSProjectData, EffectSchema>(PLUGIN_ID, {
			entryId: id,
			validator: { effectSchema },
		});

	return {
		getAll: () => _usePluginDataCategory().getEntries(),
		getById: (id: string) => _usePluginDataSingle(id).select(),
	};
});
