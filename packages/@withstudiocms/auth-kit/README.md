# @withstudiocms/auth-kit

Authentication Management utilities for StudioCMS

## Example Astro DB Tables

The following are example tables that would work with this auth-kit system. The same tables are used within StudioCMS.

```ts
import { defineTable, column, NOW } from 'astro:db';

const Users = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		url: column.text({ optional: true }),
		name: column.text(),
		email: column.text({ unique: true, optional: true }),
		avatar: column.text({
			optional: true,
			default: 'https://seccdn.libravatar.org/static/img/mm/80.png',
		}),
		username: column.text(),
		password: column.text({ optional: true }),
		updatedAt: column.date({ default: NOW, optional: true }),
		createdAt: column.date({ default: NOW, optional: true }),
		emailVerified: column.boolean({ default: false }),
		notifications: column.text({ optional: true }),
	},
});

const OAuthAccounts = defineTable({
	columns: {
		providerUserId: column.text({ primaryKey: true }),
		provider: column.text(), // i.e: github, google, discord, auth0 (dynamic to allow new providers on the fly)
		userId: column.text({ references: () => Users.columns.id }),
	},
});

const Sessions = defineTable({
	columns: {
		id: column.text({ primaryKey: true }),
		userId: column.text({ references: () => Users.columns.id, optional: false }),
		expiresAt: column.date(),
	},
});

const Permissions = defineTable({
	columns: {
		user: column.text({ references: () => Users.columns.id }),
		rank: column.text({ enum: ['owner', 'admin', 'editor', 'visitor', 'unknown'] }),
	},
});
```

## License

[MIT Licensed](./LICENSE)