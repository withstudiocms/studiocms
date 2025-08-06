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

export const StudioCMSProjectDataSchema = Schema.Struct({
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	pages: Pages,
	symbols: AnyArray,
	__STUDIOCMS_HTML: Schema.optional(Schema.String),
});

export type StudioCMSProjectData = (typeof StudioCMSProjectDataSchema)['Type'] & ProjectData;
export type StudioCMSProjectDataFields = (typeof StudioCMSProjectDataSchema)['fields'];

export const validator = { effectSchema: StudioCMSProjectDataSchema };

export const PLUGIN_ID = 'studiocms-wysiwyg';

export const UseSDK = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	const { usePluginData } = sdk.PLUGINS;

	const _usePluginDataCategory = () =>
		usePluginData<StudioCMSProjectData, StudioCMSProjectDataFields>(PLUGIN_ID, {
			validator,
		});

	const _usePluginDataSingle = (id: string) =>
		usePluginData<StudioCMSProjectData, StudioCMSProjectDataFields>(PLUGIN_ID, {
			entryId: id,
			validator,
		});

	return {
		getAll: () => _usePluginDataCategory().getEntries(),
		load: Effect.fn(function* (id: string) {
			return yield* _usePluginDataSingle(id).select();
		}),
		store: Effect.fn(function* (id: string, data: StudioCMSProjectData) {
			const existing = yield* _usePluginDataSingle(id).select();
			if (existing) {
				return yield* _usePluginDataSingle(id).update(data);
			}
			return yield* _usePluginDataSingle(id).insert(data);
		}),
	};
});
