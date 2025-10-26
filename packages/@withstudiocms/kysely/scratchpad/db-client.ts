import { ConfigProvider, Effect, Schema } from 'effect';
import { libsqlDriver } from '../src/drivers/libsql.js';
import { getDBClientLive } from '../src/index.js';
import { StudioCMSUsersTable } from '../src/tables.js';

export const dbClientExample = Effect.gen(function* () {
	const dialect = yield* libsqlDriver.pipe(
		Effect.withConfigProvider(
			ConfigProvider.fromJson({
				STUDIOCMS_LIBSQL_URL: 'file:./test.db',
			})
		)
	);

	const { db, withCodec, withDecoder, withEncoder } = yield* getDBClientLive(dialect);

	//
	// get users
	//

	const getUsers = withDecoder({
		decoder: Schema.Array(StudioCMSUsersTable.Select),
		query: () => db.selectFrom('StudioCMSUsersTable').selectAll().execute(),
	});

	const users = yield* getUsers();
	console.log('Users:', users);

	//
	// insert new user
	//

	const insertUser = withEncoder({
		encoder: StudioCMSUsersTable.Insert,
		query: (newUser) => db.insertInto('StudioCMSUsersTable').values(newUser).execute(),
	});

	const newUser = yield* insertUser({
		username: 'new_user',
		email: 'new_user@example.com',
		password: null,
		avatar: null,
		emailVerified: false,
		name: 'user',
		notifications: '',
		url: null,
		id: crypto.randomUUID(),
		updatedAt: new Date().toISOString(),
	});
	console.log('Inserted new user:', newUser); // withEncoder returns a 'InsertResult[]'

	//
	// insert new user with codec so we can get decoded result
	//

	const insertNewUser = withCodec({
		encoder: StudioCMSUsersTable.Insert,
		decoder: StudioCMSUsersTable.Select,
		query: (newUser) =>
			db.insertInto('StudioCMSUsersTable').values(newUser).returningAll().executeTakeFirstOrThrow(),
	});

	const insertedUser = yield* insertNewUser({
		username: 'codec_user',
		email: 'codec_user@example.com',
		password: null,
		avatar: null,
		emailVerified: false,
		name: 'user',
		notifications: '',
		url: null,
		id: crypto.randomUUID(),
		updatedAt: new Date().toISOString(),
	});
	console.log('Inserted user with codec:', insertedUser); // withCodec returns decoded results

	//
	// get a user by id
	//
	const getUserById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		query: (id: string) =>
			db
				.selectFrom('StudioCMSUsersTable')
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirstOrThrow(),
	});

	const user = yield* getUserById('some-user-id');
	console.log('User by ID:', user);
});
