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
	/*
	    type of 'users' is:
		const users: readonly {
			readonly url: string | null | undefined;
			readonly id: string;
			readonly name: string;
			readonly email: string | null | undefined;
			readonly avatar: string | null | undefined;
			readonly username: string;
			readonly password: string | null | undefined;
			readonly updatedAt: Date;
			readonly createdAt: Date;
			readonly emailVerified: boolean;
			readonly notifications: string | null | undefined;
		}[]
	*/

	//
	// insert new user
	//

	const insertUser = withEncoder({
		encoder: StudioCMSUsersTable.Insert,
		query: (
			newUser // 'newUser' type comes from 'encoder'
		) => db.insertInto('StudioCMSUsersTable').values(newUser).execute(),
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
	/*
		type of 'newUser' is:
		const newUser: InsertResult[]
	*/

	//
	// insert new user with codec so we can get decoded result
	//

	const insertNewUser = withCodec({
		encoder: StudioCMSUsersTable.Insert,
		decoder: StudioCMSUsersTable.Select,
		query: (
			newUser // 'newUser' type comes from 'encoder'
		) =>
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
	/*
	    type of 'insertedUser' is:
		const user: {
			readonly url: string | null | undefined;
			readonly id: string;
			readonly name: string;
			readonly email: string | null | undefined;
			readonly avatar: string | null | undefined;
			readonly username: string;
			readonly password: string | null | undefined;
			readonly updatedAt: Date;
			readonly createdAt: Date;
			readonly emailVerified: boolean;
			readonly notifications: string | null | undefined;
		}
	*/

	//
	// get a user by id
	//
	const getUserById = withCodec({
		encoder: Schema.String,
		decoder: Schema.UndefinedOr(StudioCMSUsersTable.Select),
		query: (
			id // 'id' type comes from 'encoder'
		) =>
			db
				.selectFrom('StudioCMSUsersTable')
				.selectAll()
				.where('id', '=', id)
				.executeTakeFirstOrThrow(),
	});

	const user = yield* getUserById('some-user-id');
	console.log('User by ID:', user);
	/*
	    type of 'user' is:
		const user: {
			readonly url: string | null | undefined;
			readonly id: string;
			readonly name: string;
			readonly email: string | null | undefined;
			readonly avatar: string | null | undefined;
			readonly username: string;
			readonly password: string | null | undefined;
			readonly updatedAt: Date;
			readonly createdAt: Date;
			readonly emailVerified: boolean;
			readonly notifications: string | null | undefined;
		} | undefined
	*/
});
