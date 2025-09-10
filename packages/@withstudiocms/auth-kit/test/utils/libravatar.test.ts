import { describe, expect, it } from 'vitest';
import libravatar from '../../src/utils/libravatar.js';

// Helper for predictable hash (MD5 of 'user@example.com')
const knownEmail = 'user@example.com';
const knownEmailHash = 'b58996c504c5638798eb6b511e6f49af';

describe('Libravatar Utils', () => {
	it('parseUserIdentity returns correct hash and domain for email', () => {
		const { hash, domain } = libravatar.parseUserIdentity(knownEmail);
		expect(hash).toBe(knownEmailHash);
		expect(domain).toBe('example.com');
	});

	it('parseUserIdentity returns correct hash and domain for openid', () => {
		const openid = 'https://user:pass@openid.example.com/path';
		const { hash, domain } = libravatar.parseUserIdentity(undefined, openid);
		expect(domain).toBe('openid.example.com');
		expect(typeof hash).toBe('string');
		expect(hash?.length).toBe(64); // sha256 hex
	});

	it('parseUserIdentity returns nulls for invalid openid', () => {
		const { hash, domain } = libravatar.parseUserIdentity(undefined, 'not a url');
		expect(hash).toBe(null);
		expect(domain).toBe(null);
	});

	it('srvHostname returns correct target and port', () => {
		const records = [
			{ priority: 10, weight: 5, port: 80, name: 'a.example.com' },
			{ priority: 10, weight: 10, port: 80, name: 'b.example.com' },
		];
		const [target, port] = libravatar.srvHostname(records);
		expect(['a.example.com', 'b.example.com']).toContain(target);
		expect(port).toBe(80);
	});

	it('srvHostname returns nulls for empty records', () => {
		const [target, port] = libravatar.srvHostname([]);
		expect(target).toBe(null);
		expect(port).toBe(null);
	});

	it('sanitizedTarget returns null for invalid input', () => {
		expect(libravatar.sanitizedTarget([null, null], false)).toBe(null);
		expect(libravatar.sanitizedTarget(['bad!host', 80], false)).toBe(null);
		expect(libravatar.sanitizedTarget(['host', 70000], false)).toBe(null);
	});

	it('sanitizedTarget returns host:port for non-standard port', () => {
		expect(libravatar.sanitizedTarget(['host', 8080], false)).toBe('host:8080');
		expect(libravatar.sanitizedTarget(['host', 443], false)).toBe('host:443');
		expect(libravatar.sanitizedTarget(['host', 80], false)).toBe('host');
		expect(libravatar.sanitizedTarget(['host', 443], true)).toBe('host');
		expect(libravatar.sanitizedTarget(['host', 444], true)).toBe('host:444');
	});

	it('serviceName returns correct service name', () => {
		expect(libravatar.serviceName('example.com', false)).toBe('_avatars._tcp.example.com');
		expect(libravatar.serviceName('example.com', true)).toBe('_avatars-sec._tcp.example.com');
		expect(libravatar.serviceName(null, true)).toBe(null);
	});

	it('composeAvatarUrl builds correct URL', () => {
		const url = libravatar.composeAvatarUrl(null, knownEmailHash, '?s=128', true);
		expect(url).toBe(`https://seccdn.libravatar.org/avatar/${knownEmailHash}?s=128`);

		const url2 = libravatar.composeAvatarUrl('custom.example.com:8080', knownEmailHash, '', false);
		expect(url2).toBe('http://custom.example.com:8080/avatar/' + knownEmailHash);
	});

	it('getAvatarUrl throws if no email or openid', async () => {
		await expect(libravatar.getAvatarUrl({})).rejects.toThrow(/must be provided/);
	});

	it('getAvatarUrl returns a valid URL for email', async () => {
		const url = await libravatar.getAvatarUrl({ email: knownEmail, https: true, s: 128 });
		expect(url).toMatch(/^https:\/\/seccdn\.libravatar\.org\/avatar\/[a-f0-9]+\?s=128$/);
	});

	it('getAvatarUrl returns a valid URL for openid', async () => {
		const url = await libravatar.getAvatarUrl({
			openid: 'https://openid.example.com/user',
			https: false,
			d: 'retro',
		});
		expect(url).toMatch(/^http:\/\/cdn\.libravatar\.org\/avatar\/[a-f0-9]+\?d=retro$/);
	});
});
