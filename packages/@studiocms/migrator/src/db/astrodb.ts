import { type AstroDBTableKeys, astroDbTableKeys } from '../lib/tableMap';
import { db, sql } from './astro-db-drizzle-client.js';

/**
 * Search for tables in a LibSQL database by name using Drizzle
 * @param searchPattern - Search pattern (supports wildcards: %)
 * @returns Array of matching table names
 */
export async function searchTables(searchPattern: string): Promise<string[]> {
	const result = await db.all<{ name: string }>(
		sql`
      SELECT name 
      FROM sqlite_master 
      WHERE type = 'table' 
        AND name LIKE ${searchPattern}
        AND name NOT LIKE 'sqlite_%'
        AND name != '_astro_db_snapshot'
      ORDER BY name
    `
	);

	return result.map((row) => row.name);
}

/**
 * Get all tables in the database
 * @returns Array of all table names
 */
export async function getAllTables(): Promise<string[]> {
	return searchTables('%');
}

/**
 * Check if a specific table exists
 * @param tableName - Exact table name to check
 * @returns Boolean indicating if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
	const tables = await searchTables(tableName);
	return tables.length > 0;
}

export const getTableLength = async (table: AstroDBTableKeys) => {
	const result = await db.get<{ count: number }>(
		sql`SELECT COUNT(*) as count FROM ${sql.raw(table)}`
	);

	return result?.count ?? 0;
};

export const getDataMigrationMeta = async () => {
	const tableLengths: Record<AstroDBTableKeys, number> = {} as Record<AstroDBTableKeys, number>;

	for (const table of astroDbTableKeys) {
		const result = await getTableLength(table).catch(() => 0);
		tableLengths[table] = result;
	}

	return tableLengths;
};

// Usage examples:
// async function examples() {
// 	// Search for tables starting with "user"
// 	const userTables = await searchTables('user%');
// 	console.log('Tables starting with "user":', userTables);

// 	// Search for tables containing "post"
// 	const postTables = await searchTables('%post%');
// 	console.log('Tables containing "post":', postTables);

// 	// Get all tables
// 	const allTables = await getAllTables();
// 	console.log('All tables:', allTables);

// 	// Check if specific table exists
// 	const exists = await tableExists('users');
// 	console.log('Table "users" exists:', exists);
// }
