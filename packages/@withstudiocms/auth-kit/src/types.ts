export interface UserSession {
	expiresAt: Date;
	id: string;
	userId: string;
}

export interface UserData {
	name: string;
	id: string;
	url: string | null;
	email: string | null;
	avatar: string | null;
	username: string;
	password: string | null;
	updatedAt: Date | null;
	createdAt: Date | null;
	emailVerified: boolean;
	notifications: string | null;
}

export interface SessionAndUserData {
	session: UserSession;
	user: UserData;
}

export type SessionValidationResult =
	| SessionAndUserData
	| {
			session: null;
			user: null;
	  };

export interface SessionTools {
	createSession(params: UserSession): Promise<UserSession>;
	sessionAndUserData(sessionId: string): Promise<SessionAndUserData[]>;
	deleteSession(sessionId: string): Promise<void>;
	updateSession(sessionId: string, data: Partial<UserSession>): Promise<UserSession[]>;
}

export interface SessionConfig {
	expTime: number;
	cookieName: string;
	sessionTools?: SessionTools;
}
