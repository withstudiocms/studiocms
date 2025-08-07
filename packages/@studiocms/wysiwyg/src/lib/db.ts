import { SDKCore } from 'studiocms:sdk';
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

export const studioCMSProjectDataSchema = Schema.Struct({
	dataSources: AnyArray,
	assets: AnyArray,
	styles: AnyArray,
	pages: Pages,
	symbols: AnyArray,
	__STUDIOCMS_HTML: Schema.optional(Schema.String),
});

export type StudioCMSProjectData = typeof studioCMSProjectDataSchema;

export const PLUGIN_ID = 'studiocms-wysiwyg';

export const UseSDK = Effect.gen(function* () {
	const sdk = yield* SDKCore;

	const { usePluginData } = sdk.PLUGINS;

	const createPluginDataAccessor = () =>
		usePluginData<StudioCMSProjectData>(PLUGIN_ID, {
			validator: { effectSchema: studioCMSProjectDataSchema },
		});

	const createPluginDataAccessorById = (id: string) =>
		usePluginData<StudioCMSProjectData>(PLUGIN_ID, {
			entryId: id,
			validator: { effectSchema: studioCMSProjectDataSchema },
		});

	return {
		getAll: () => createPluginDataAccessor().getEntries(),
		load: Effect.fn(function* (id: string) {
			return yield* createPluginDataAccessorById(id).select();
		}),
		store: Effect.fn(function* (id: string, data: StudioCMSProjectData) {
			const existing = yield* createPluginDataAccessorById(id).select();
			if (existing) {
				return yield* createPluginDataAccessorById(id).update(data);
			}
			return yield* createPluginDataAccessorById(id).insert(data);
		}),
	};
});
