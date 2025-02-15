import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { createTable, serial, text } from 'drizzle-orm/sqlite-core';
import type { Plugin, ProjectData } from 'grapesjs';

const client = createClient({ url: 'file:mydb.sqlite' });
const db = drizzle(client);

const projects = createTable('projects', {
	id: serial('id').primaryKey(),
	key: text('key').unique(),
	data: text('data'),
});

db.run(projects);

export type StorageOptions = {
	key?: string;
};

export type PluginOptions = {
	type?: string;
	options?: StorageOptions;
};

const plugin: Plugin<PluginOptions> = (editor, opts = {}) => {
	const storageOptions: StorageOptions = {
		key: 'gjsProject',
		...opts.options,
	};

	const options: PluginOptions = {
		type: 'drizzle',
		...opts,
		options: storageOptions,
	};

	const sm = editor.Storage;
	const storageName = options.type!;
	sm.getConfig().options![storageName] = storageOptions;

	sm.add<StorageOptions>(storageName, {
		async load(opts) {
			const result = await db.select().from(projects).where(eq(projects.key, opts.key!)).get();
			return result ? JSON.parse(result.data) : {};
		},

		async store(data, opts) {
			const jsonData = JSON.stringify(data);
			await db
				.insert(projects)
				.values({ key: opts.key!, data: jsonData })
				.onConflictDoUpdate({
					target: projects.key,
					set: { data: jsonData },
				});
			return data;
		},
	});
};

export default plugin;
