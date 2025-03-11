import { getUserData, verifyUserPermissionLevel } from 'studiocms:auth/lib/user';
import { developerConfig } from 'studiocms:config';
import { apiResponseLogger } from 'studiocms:logger';
import { sendEditorNotification } from 'studiocms:notifier';
import studioCMS_SDK_Cache from 'studiocms:sdk/cache';
import type { APIContext, APIRoute } from 'astro';

const { testingAndDemoMode } = developerConfig;

interface FolderBase {
	folderName: string;
	parentFolder: string | null;
}

interface FolderEdit extends FolderBase {
	id: string;
}

export const POST: APIRoute = async (context: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'editor');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: FolderBase = await context.request.json();

	const { folderName, parentFolder } = jsonData;

	if (!folderName) {
		return apiResponseLogger(400, 'Invalid form data, folderName is required');
	}

	try {
		await studioCMS_SDK_Cache.POST.folder({
			id: crypto.randomUUID(),
			name: folderName,
			parent: parentFolder || null,
		});

		await studioCMS_SDK_Cache.UPDATE.folderList();
		await studioCMS_SDK_Cache.UPDATE.folderTree();

		await sendEditorNotification('new_folder', folderName);

		return apiResponseLogger(200, 'Folder created successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to create folder');
	}
};

export const PATCH: APIRoute = async (context: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'editor');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: FolderEdit = await context.request.json();

	const { id, folderName, parentFolder } = jsonData;

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	if (!folderName) {
		return apiResponseLogger(400, 'Invalid form data, folderName is required');
	}

	try {
		await studioCMS_SDK_Cache.UPDATE.folder({
			id,
			name: folderName,
			parent: parentFolder || null,
		});

		await sendEditorNotification('folder_updated', folderName);

		return apiResponseLogger(200, 'Folder updated successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to update folder');
	}
};

export const DELETE: APIRoute = async (context: APIContext) => {
	// Check if testing and demo mode is enabled
	if (testingAndDemoMode) {
		return apiResponseLogger(400, 'Testing and demo mode is enabled, this action is disabled.');
	}

	// Get user data
	const userData = await getUserData(context);

	// Check if user is logged in
	if (!userData.isLoggedIn) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	// Check if user has permission
	const isAuthorized = await verifyUserPermissionLevel(userData, 'admin');
	if (!isAuthorized) {
		return apiResponseLogger(403, 'Unauthorized');
	}

	const jsonData: FolderEdit = await context.request.json();

	const { id } = jsonData;

	if (!id) {
		return apiResponseLogger(400, 'Invalid form data, id is required');
	}

	const { name: folderName } = (await studioCMS_SDK_Cache.GET.folder(id)) || {};

	if (!folderName) {
		return apiResponseLogger(404, 'Folder not found');
	}

	try {
		await studioCMS_SDK_Cache.DELETE.folder(id);

		await sendEditorNotification('folder_deleted', folderName);

		return apiResponseLogger(200, 'Folder deleted successfully');
	} catch (error) {
		return apiResponseLogger(500, 'Failed to delete folder');
	}
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 204,
		statusText: 'No Content',
		headers: {
			Allow: 'OPTIONS, POST, DELETE, PATCH',
			'ALLOW-ACCESS-CONTROL-ORIGIN': '*',
			'Cache-Control': 'public, max-age=604800, immutable',
			Date: new Date().toUTCString(),
		},
	});
};

export const ALL: APIRoute = async () => {
	return new Response(null, {
		status: 405,
		statusText: 'Method Not Allowed',
		headers: {
			'ACCESS-CONTROL-ALLOW-ORIGIN': '*',
		},
	});
};
