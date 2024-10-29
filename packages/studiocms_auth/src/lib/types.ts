export interface UserTable {
	id: string;
	url: string | null;
	name: string;
	email: string | null;
	avatar: string | null;
	username: string;
	password: string | null;
	updatedAt: Date | null;
	createdAt: Date | null;
}

export interface OAuthAccountsTable {
	provider: string;
	providerUserId: string;
	userId: string;
}

export interface SessionTable {
	id: string;
	userId: string;
	expiresAt: Date;
}

export interface PermissionsTable {
	user: string;
	rank: string;
}

export type UserSessionData = {
	isLoggedIn: boolean;
	user: UserTable | null;
	permissionLevel: 'owner' | 'admin' | 'editor' | 'visitor' | 'unknown';
};

export type UserSession = {
	user: UserTable;
	session: SessionTable;
};

export type SessionValidationResult = UserSession | { session: null; user: null };
