import { describe, expect, it } from 'vitest';
import {
	FolderListMapID,
	FolderTreeMapID,
	PageFolderTreeMapID,
	SiteConfigMapID,
	StudioCMSPkgId,
	VersionMapID,
} from '../../../src/virtuals/sdk/consts';

describe('StudioCMS SDK Constants', () => {
	it('SiteConfigMapID should be "__StudioCMS_Site_Config"', () => {
		expect(SiteConfigMapID).toBe('__StudioCMS_Site_Config');
	});

	it('VersionMapID should be "__StudioCMS_Latest_Version"', () => {
		expect(VersionMapID).toBe('__StudioCMS_Latest_Version');
	});

	it('FolderTreeMapID should be "__StudioCMS_Folder_Tree"', () => {
		expect(FolderTreeMapID).toBe('__StudioCMS_Folder_Tree');
	});

	it('PageFolderTreeMapID should be "__StudioCMS_Page_Folder_Tree"', () => {
		expect(PageFolderTreeMapID).toBe('__StudioCMS_Page_Folder_Tree');
	});

	it('FolderListMapID should be "__StudioCMS_Folder_List"', () => {
		expect(FolderListMapID).toBe('__StudioCMS_Folder_List');
	});

	it('StudioCMSPkgId should be "studiocms"', () => {
		expect(StudioCMSPkgId).toBe('studiocms');
	});
});
