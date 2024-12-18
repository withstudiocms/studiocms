import type {
	BaseCacheObject,
	PageDataCacheObject,
	ProcessedCacheConfig,
	STUDIOCMS_SDK,
	SiteConfig,
	SiteConfigCacheObject,
	VersionCacheObject,
} from './types';
import { StudioCMS_SDK_Error } from './utils';

export class StudioCMSCacheError extends StudioCMS_SDK_Error {
	override name = 'StudioCMS Cache Error';
}

export class StudioCMSCache {
	pages: Map<string, PageDataCacheObject>;
	private siteConfig: Map<string, SiteConfigCacheObject>;
	private version: Map<string, VersionCacheObject>;
	private cacheConfig: ProcessedCacheConfig;
	private sdk: STUDIOCMS_SDK;
	private CMSSiteConfigId: number;
	private versionCacheLifetime: number;

	constructor(
		pagesCacheMap: Map<string, PageDataCacheObject>,
		siteConfigCacheMap: Map<string, SiteConfigCacheObject>,
		versionCacheMap: Map<string, VersionCacheObject>,
		cacheConfig: ProcessedCacheConfig,
		studioCMS_SDK: STUDIOCMS_SDK,
		CMSSiteConfigId: number,
		versionCacheLifetime: number
	) {
		this.pages = pagesCacheMap;
		this.siteConfig = siteConfigCacheMap;
		this.version = versionCacheMap;
		this.cacheConfig = cacheConfig;
		this.sdk = studioCMS_SDK;
		this.CMSSiteConfigId = CMSSiteConfigId;
		this.versionCacheLifetime = versionCacheLifetime;
	}

	private SiteConfigMapID = '__StudioCMS_Site_Config';
	private VersionMapID = '__StudioCMS_Latest_Version';

	// Misc Utils

	isCacheExpired(entry: BaseCacheObject, lifetime = this.cacheConfig.lifetime): boolean {
		return new Date().getTime() - entry.lastCacheUpdate.getTime() > lifetime;
	}

	private async getLatestVersionFromNPM(): Promise<string> {
		try {
			const npmResponse = await fetch('https://registry.npmjs.org/studiocms/latest');
			const npmData = await npmResponse.json();
			return npmData.version as string;
		} catch (error) {
			throw new StudioCMSCacheError('Error fetching latest version from NPM');
		}
	}

	private versionReturn(version: string): VersionCacheObject {
		return {
			version,
			lastCacheUpdate: new Date(),
		};
	}

	private siteConfigReturn(siteConfig: SiteConfig): SiteConfigCacheObject {
		return {
			data: siteConfig,
			lastCacheUpdate: new Date(),
		};
	}

	// Version Utils

	async getVersion(): Promise<VersionCacheObject> {
		if (!this.cacheConfig.enabled) {
			const version = await this.getLatestVersionFromNPM();

			return this.versionReturn(version);
		}

		const latestVersion = this.version.get(this.VersionMapID);

		if (!latestVersion || this.isCacheExpired(latestVersion, this.versionCacheLifetime)) {
			const version = await this.getLatestVersionFromNPM();

			const latestVersion = this.versionReturn(version);

			this.version.set(this.VersionMapID, latestVersion);

			return latestVersion;
		}

		return latestVersion;
	}

	async updateVersion(): Promise<VersionCacheObject> {
		const latestVersion = await this.getLatestVersionFromNPM();

		const newVersion = this.versionReturn(latestVersion);

		if (!this.cacheConfig.enabled) {
			return newVersion;
		}

		this.version.set(this.VersionMapID, newVersion);

		return newVersion;
	}

	clearVersion(): void {
		this.version.clear();
	}

	// Site Config Utils

	async getSiteConfig(): Promise<SiteConfigCacheObject> {
		if (!this.cacheConfig.enabled) {
			const newSiteConfig = await this.sdk.GET.database.config();

			if (!newSiteConfig) {
				throw new StudioCMSCacheError('Site config not found in database');
			}

			return this.siteConfigReturn(newSiteConfig);
		}

		const siteConfig = this.siteConfig.get(this.SiteConfigMapID);

		if (!siteConfig || this.isCacheExpired(siteConfig)) {
			const newSiteConfig = await this.sdk.GET.database.config();

			if (!newSiteConfig) {
				throw new StudioCMSCacheError('Site config not found in database');
			}

			const returnConfig: SiteConfigCacheObject = this.siteConfigReturn(newSiteConfig);

			this.siteConfig.set(this.SiteConfigMapID, returnConfig);

			return returnConfig;
		}

		return siteConfig;
	}

	async updateSiteConfig(data: SiteConfig): Promise<SiteConfigCacheObject> {
		// Update the site config in the database
		const newSiteConfig = await this.sdk.UPDATE.siteConfig({ ...data, id: this.CMSSiteConfigId });

		// Check if the data was returned successfully
		if (!newSiteConfig) {
			throw new StudioCMSCacheError('Could not retrieve updated data from the database.');
		}

		const returnConfig: SiteConfigCacheObject = this.siteConfigReturn(newSiteConfig);

		// Check if caching is disabled
		if (!this.cacheConfig.enabled) {
			// Transform and return the data
			return returnConfig;
		}

		// Update the cache
		this.siteConfig.set(this.SiteConfigMapID, returnConfig);

		return returnConfig;
	}
}
