/**
 * Creates a user avatar URL based on the provided email.
 *
 * This function takes an email address, processes it to generate a unique hash,
 * and returns a URL for the user's avatar using the Libravatar service.
 *
 * @param email - The email address of the user.
 * @returns A promise that resolves to the URL of the user's avatar.
 */
export async function createUserAvatar(email: string) {
	// trim and lowercase the email
	const safeEmail = email.trim().toLowerCase();
	// encode as (utf-8) Uint8Array
	const msgUint8 = new TextEncoder().encode(safeEmail);
	// hash the message
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	// convert buffer to byte array
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	// convert bytes to hex string
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	// return the Libravatar url
	return `https://seccdn.libravatar.org/avatar/${hashHex}?s=400&d=retro`;
}