// URL Mapping Service - handles resolution and auto-refresh of URLs
import type {
	UrlMapping,
	UrlMappingDatabaseDefinition,
	UrlMappingServiceDefinition,
	UrlMetadata,
} from '../definitions';

/**
 * URL Mapping Service implementation.
 *
 * This service manages the mapping between storage file identifiers and their corresponding URLs.
 * It handles URL resolution, automatic refreshing of expired URLs, registration of new mappings,
 * deletion of mappings, and cleanup of expired entries.
 */
export default class UrlMappingService implements UrlMappingServiceDefinition {
	database;

	constructor(database: UrlMappingDatabaseDefinition) {
		this.database = database;
	}

	/**
	 * Resolve a URL from an identifier (e.g., "storage-file://path/to/file.jpg")
	 * Automatically refreshes expired URLs
	 */
	async resolve(
		identifier: `storage-file://${string}`,
		refreshCallback: (key: string) => Promise<UrlMetadata>
	): Promise<UrlMetadata> {
		const mapping = await this.database.get(identifier);
		const now = Date.now();

		// Case 1: Permanent URL - return immediately
		if (mapping?.isPermanent) {
			return {
				url: mapping.url,
				isPermanent: true,
			};
		}

		// Case 2: Expired or missing - refresh from S3
		if (!mapping || (mapping.expiresAt && mapping.expiresAt <= now)) {
			const key = this.extractKeyFromIdentifier(identifier);
			const metadata = await refreshCallback(key);

			await this.register(identifier, metadata);

			return metadata;
		}

		// Case 3: Valid cached URL
		return {
			url: mapping.url,
			isPermanent: false,
			expiresAt: mapping.expiresAt,
		};
	}

	/**
	 * Register a new URL mapping
	 */
	async register(identifier: `storage-file://${string}`, metadata: UrlMetadata): Promise<void> {
		const now = Date.now();
		const mapping: UrlMapping = {
			identifier,
			url: metadata.url,
			isPermanent: metadata.isPermanent,
			expiresAt: metadata.expiresAt,
			createdAt: now,
			updatedAt: now,
		};

		await this.database.set(mapping);
	}

	/**
	 * Delete a URL mapping
	 */
	async delete(identifier: `storage-file://${string}`): Promise<void> {
		await this.database.delete(identifier);
	}

	/**
	 * Clean up expired entries (optional maintenance)
	 */
	async cleanup(): Promise<number> {
		return await this.database.cleanup();
	}

	/**
	 * Get all mappings (for debugging/admin)
	 */
	async getAll(): Promise<UrlMapping[]> {
		return await this.database.getAll();
	}

	/**
	 * Extract storage key from identifier
	 * e.g., "storage-file://path/to/file.jpg" -> "path/to/file.jpg"
	 */
	private extractKeyFromIdentifier(identifier: `storage-file://${string}`): string {
		if (identifier.startsWith('storage-file://')) {
			return identifier.substring('storage-file://'.length);
		}
		// Fallback: treat as direct key
		return identifier;
	}

	/**
	 * Create identifier from storage key
	 * e.g., "path/to/file.jpg" -> "storage-file://path/to/file.jpg"
	 */
	createIdentifier(key: string): `storage-file://${string}` {
		return `storage-file://${key}`;
	}
}
