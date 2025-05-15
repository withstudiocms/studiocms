import { Encryption } from './encryption.js';
import { Password } from './password.js';
import { Session } from './session.js';
import { User } from './user.js';
import { VerifyEmail } from './verify-email.js';

export { Encryption };
export { Password };
export { Session };
export { User };
export { VerifyEmail };

export type Mod = {
	/**
	 * The `Encryption` class provides methods for encrypting and decrypting data using AES-128-GCM encryption.
	 * It includes utilities for handling encryption keys, encrypting/decrypting data as `Uint8Array`, and converting
	 * encrypted/decrypted data to and from strings.
	 *
	 * ### Methods:
	 * - `getKey`: Retrieves the encryption key from the environment variable `CMS_ENCRYPTION_KEY`.
	 * - `encrypt`: Encrypts a `Uint8Array` using AES-128-GCM and returns the encrypted data.
	 * - `encryptToString`: Encrypts a string and returns the encrypted data as a `Uint8Array`.
	 * - `decrypt`: Decrypts a `Uint8Array` encrypted with AES-128-GCM and returns the decrypted data.
	 * - `decryptToString`: Decrypts a `Uint8Array` and returns the decrypted data as a string.
	 *
	 * ### Encryption Details:
	 * - The encryption algorithm used is `aes-128-gcm`.
	 * - The encrypted data includes the initialization vector (IV), the encrypted content, and the authentication tag.
	 * - The IV is randomly generated for each encryption operation.
	 *
	 * ### Error Handling:
	 * - The `decrypt` method throws an error if the encrypted data is less than 33 bytes.
	 *
	 * ### Dependencies:
	 * - `Effect`: A utility for managing asynchronous effects.
	 * - `pipeLogger` and `genLogger`: Logging utilities for tracing method calls.
	 * - `DynamicBuffer`: A utility for dynamically managing byte buffers.
	 * - `crypto`: Used for generating random values and creating cipher/decipher instances.
	 */
	Encryption: typeof Encryption;
	/**
	 * The `Password` class provides methods for hashing passwords, verifying password hashes,
	 * and checking the strength of passwords. It includes functionality for ensuring passwords
	 * meet security standards, such as length requirements, avoiding unsafe passwords, and
	 * checking against the pwned password database.
	 *
	 * ### Methods:
	 * - `hashPassword`: Hashes a plain text password using a secure algorithm.
	 * - `verifyPasswordHash`: Verifies if a plain text password matches a hashed password.
	 * - `verifyPasswordStrength`: Checks if a password meets strength requirements, including
	 *   length, safety, and absence from the pwned password database.
	 *
	 * ### Dependencies:
	 * - `Scrypt`: Used for password hashing.
	 * - `CheckIfUnsafe`: Used to check if a password is a commonly known unsafe password.
	 * - `FetchHttpClient`: Used for making HTTP requests to external services, such as the
	 *   pwned password database API.
	 *
	 * ### Notes:
	 * - The `legacy0HashPassword` function is marked as deprecated and should not be used in
	 *   new implementations.
	 * - The `constantTimeEqual` function ensures secure string comparison to prevent timing
	 *   attacks.
	 */
	Password: typeof Password;
	/**
	 * The `Session` class provides a set of methods for managing user sessions, including
	 * creating, validating, and invalidating sessions, as well as handling session cookies.
	 *
	 * This class is built using the `Effect.Service` pattern and relies on the `SDKCore`
	 * dependency for database interactions. It includes utility functions for generating
	 * session tokens, managing expiration dates, and interacting with session-related
	 * cookies in an API context.
	 *
	 * ### Methods:
	 * - `generateSessionToken`: Generates a random session token using base32 encoding.
	 * - `makeExpirationDate`: Creates a new expiration date for a session.
	 * - `createSession`: Creates a new session for a user and stores it in the database.
	 * - `validateSessionToken`: Validates a session token, extending its expiration if valid
	 *   or deleting it if expired.
	 * - `invalidateSession`: Deletes a session from the database by its ID.
	 * - `setSessionTokenCookie`: Sets a session token cookie in the provided API context.
	 * - `deleteSessionTokenCookie`: Deletes the session token cookie by setting it with an
	 *   empty value and a max age of 0.
	 * - `setOAuthSessionTokenCookie`: Sets an OAuth session token cookie in the given API context.
	 * - `createUserSession`: Creates a new user session, including generating a token, storing
	 *   it in the database, and setting a cookie.
	 *
	 * ### Dependencies:
	 * - `SDKCore`: Provides access to the database operations for session management.
	 *
	 * ### Usage:
	 * This class is designed to be used in the context of a web application where user
	 * authentication and session management are required. It provides a robust and
	 * extensible framework for handling session-related operations.
	 */
	Session: typeof Session;
	/**
	 * The `User` class provides a set of methods and utilities for managing user authentication,
	 * user data, and permissions within the StudioCMS application. It includes functionality for:
	 *
	 * - Verifying usernames based on length, character restrictions, and safety checks.
	 * - Creating user avatars using the Libravatar service.
	 * - Creating new users with local credentials or OAuth credentials.
	 * - Updating user passwords and retrieving password hashes.
	 * - Fetching user data based on email or session context.
	 * - Determining user permission levels and checking access permissions.
	 *
	 * ### Dependencies
	 * This class relies on the following services:
	 * - `SDKCore`: Core SDK for interacting with the backend.
	 * - `CheckIfUnsafe`: Utility for checking unsafe usernames.
	 * - `Session`: Session management service.
	 * - `Password`: Password hashing and validation service.
	 * - `Notifications`: Notification service for sending admin alerts.
	 *
	 * ### Methods
	 * - `verifyUsernameInput(username: string)`: Verifies if a username meets the required criteria.
	 * - `createUserAvatar(email: string)`: Generates a user avatar URL based on the provided email.
	 * - `createLocalUser(name: string, username: string, email: string, password: string)`: Creates a new local user.
	 * - `createOAuthUser(userFields: tsUsersInsert, oAuthFields: { provider: string; providerUserId: string })`: Creates a new user with OAuth credentials.
	 * - `updateUserPassword(userId: string, password: string)`: Updates the password for a user.
	 * - `getUserPasswordHash(userId: string)`: Retrieves the password hash for a given user.
	 * - `getUserFromEmail(email: string)`: Retrieves a user based on their email address.
	 * - `getUserData(context: AstroGlobal | APIContext)`: Retrieves user session data based on the provided context.
	 * - `getUserPermissionLevel(userData: UserSessionData | CombinedUserData)`: Retrieves the user's permission level.
	 * - `isUserAllowed(userData: UserSessionData | CombinedUserData, requiredPerms: AvailablePermissionRanks)`: Checks if a user has the required permissions.
	 *
	 * ### Static Properties
	 * - `Provide`: Provides the default instance of the `User` service.
	 * - `LinkNewOAuthCookieName`: The cookie name used for linking new OAuth accounts.
	 * - `UserPermissionLevel`: Enum representing different user permission levels.
	 * - `permissionRanksMap`: Mapping of permission ranks to their corresponding levels.
	 */
	User: typeof User;
	/**
	 * The `VerifyEmail` service provides functionality for managing email verification
	 * processes within the StudioCMS application. It includes methods for checking
	 * email verification status, creating and deleting verification requests, sending
	 * verification emails, and determining if a user's email is verified based on
	 * various conditions.
	 *
	 * ### Dependencies:
	 * - `Mailer`: Handles email sending operations.
	 * - `SDKCore`: Provides access to the StudioCMS SDK for database and authentication operations.
	 *
	 * ### Methods:
	 * - `isEmailVerificationEnabled`: Checks if email verification is enabled in the StudioCMS configuration.
	 * - `getEmailVerificationRequest`: Retrieves an email verification request by its ID.
	 * - `deleteEmailVerificationRequest`: Deletes an email verification request by its ID.
	 * - `createEmailVerificationRequest`: Creates an email verification request for a given user.
	 * - `sendVerificationEmail`: Sends a verification email to the user with the given userId.
	 * - `isEmailVerified`: Checks if the user's email is verified based on various conditions.
	 *
	 * ### Private Utilities:
	 * - `getMailerStatus`: Checks if the mailer service is enabled.
	 * - `getSettings`: Retrieves the notification settings from the database or returns default settings.
	 * - `generateUrl`: Generates a URL with the given base, path, and query parameters.
	 */
	VerifyEmail: typeof VerifyEmail;
};
