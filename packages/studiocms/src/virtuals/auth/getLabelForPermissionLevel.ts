const getLabelForPermissionLevel = (
	permissionLevel: 'admin' | 'editor' | 'owner' | 'visitor' | string
) => {
	switch (permissionLevel) {
		case 'admin':
			return 'Administrator';
		case 'editor':
			return 'Editor';
		case 'owner':
			return 'Owner';
		case 'visitor':
			return 'Visitor';
		default:
			return 'Unknown';
	}
};

export { getLabelForPermissionLevel };
