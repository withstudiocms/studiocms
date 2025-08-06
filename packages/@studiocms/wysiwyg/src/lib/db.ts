import { SDKCore } from 'studiocms:sdk';
import type { ProjectData } from 'grapesjs';
import { Effect, Schema } from 'studiocms/effect';

// this is used for testing, and is planned to be used in the future

const AnyArray = Schema.Array(Schema.Any);

const Component = Schema.Struct({
	type: Schema.String,
	stylable: AnyArray,
	attributes: Schema.Record({ key: Schema.String, value: Schema.Any }),
	components: AnyArray,
	head: Schema.Struct({
		type: Schema.String,
	}),
	docEl: Schema.Struct({
		tagName: Schema.String,
	}),
});

const Frame = Schema.Struct({
	id: Schema.String,
	component: Component,
});

const Frames = Schema.Array(Frame);

const Page = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	frames: Frames,
});

const Pages = Schema.Array(Page);

export const StudioCMSProjectData = Schema.Struct({
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	pages: Pages,
	symbols: AnyArray,
	__STUDIOCMS_HTML: Schema.optional(Schema.String),
});

export type StudioCMSProjectData = (typeof StudioCMSProjectData)['Type'] & ProjectData;
export type StudioCMSProjectDataSchema = (typeof StudioCMSProjectData)['fields'];

export const PLUGIN_ID = 'studiocms-wysiwyg';

export const UseSDK = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	const { usePluginData } = sdk.PLUGINS;

	const _usePluginDataCategory = () =>
		usePluginData<StudioCMSProjectData, StudioCMSProjectDataSchema>(PLUGIN_ID, {
			validator: { effectSchema: StudioCMSProjectData },
		});

	const _usePluginDataSingle = (id: string) =>
		usePluginData<StudioCMSProjectData, StudioCMSProjectDataSchema>(PLUGIN_ID, {
			entryId: id,
			validator: { effectSchema: StudioCMSProjectData },
		});

	const test = yield* _usePluginDataSingle('test').select();

	if (test) {
	}

	return {
		getAll: () => _usePluginDataCategory().getEntries(),
		getById: (id: string) => _usePluginDataSingle(id).select(),
	};
});
