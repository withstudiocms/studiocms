import { dbEnv } from 'virtual:studiocms-devapps/config';
import { createClient } from '@libsql/client/web';

const client = createClient({
	url: dbEnv.remoteUrl,
	authToken: dbEnv.token,
	intMode: 'bigint',
});

export { client };
