import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import libravatar from '../../dist/utils/libravatar.js';

// Helper for predictable hash (MD5 of 'user@example.com')
const knownEmail = 'user@example.com';
const knownEmailHash = 'b58996c504c5638798eb6b511e6f49af';

describe('Libravatar Utils', () => {
	test('parseUserIdentity returns correct hash and domain for email', () => {
		const { hash, domain } = libravatar.parseUserIdentity(knownEmail);
		assert.equal(hash, knownEmailHash);
		assert.equal(domain, 'example.com');
	});

	test('parseUserIdentity returns correct hash and domain for openid', () => {
		const openid = 'https://user:pass@openid.example.com/path';
		const { hash, domain } = libravatar.parseUserIdentity(undefined, openid);
		assert.equal(domain, 'openid.example.com');
		assert.equal(typeof hash, 'string');
		assert.equal(hash.length, 64); // sha256 hex
	});

	test('parseUserIdentity returns nulls for invalid openid', () => {
		const { hash, domain } = libravatar.parseUserIdentity(undefined, 'not a url');
		assert.equal(hash, null);
		assert.equal(domain, null);
	});

	test('srvHostname returns correct target and port', () => {
		const records = [
			{ priority: 10, weight: 5, port: 80, name: 'a.example.com' },
			{ priority: 10, weight: 10, port: 80, name: 'b.example.com' },
		];
		const [target, port] = libravatar.srvHostname(records);
		assert.ok(['a.example.com', 'b.example.com'].includes(target));
		assert.equal(port, 80);
	});

	test('srvHostname returns nulls for empty records', () => {
		const [target, port] = libravatar.srvHostname([]);
		assert.equal(target, null);
		assert.equal(port, null);
	});

	test('sanitizedTarget returns null for invalid input', () => {
		assert.equal(libravatar.sanitizedTarget([null, null], false), null);
		assert.equal(libravatar.sanitizedTarget(['bad!host', 80], false), null);
		assert.equal(libravatar.sanitizedTarget(['host', 70000], false), null);
	});

	test('sanitizedTarget returns host:port for non-standard port', () => {
		assert.equal(libravatar.sanitizedTarget(['host', 8080], false), 'host:8080');
		assert.equal(libravatar.sanitizedTarget(['host', 443], false), 'host:443');
		assert.equal(libravatar.sanitizedTarget(['host', 80], false), 'host');
		assert.equal(libravatar.sanitizedTarget(['host', 443], true), 'host');
		assert.equal(libravatar.sanitizedTarget(['host', 444], true), 'host:444');
	});

	test('serviceName returns correct service name', () => {
		assert.equal(libravatar.serviceName('example.com', false), '_avatars._tcp.example.com');
		assert.equal(libravatar.serviceName('example.com', true), '_avatars-sec._tcp.example.com');
		assert.equal(libravatar.serviceName(null, true), null);
	});

	test('composeAvatarUrl builds correct URL', () => {
		const url = libravatar.composeAvatarUrl(null, knownEmailHash, '?s=128', true);
		assert.equal(url, `https://seccdn.libravatar.org/avatar/${knownEmailHash}?s=128`);

		const url2 = libravatar.composeAvatarUrl('custom.example.com:8080', knownEmailHash, '', false);
		assert.equal(url2, 'http://custom.example.com:8080/avatar/' + knownEmailHash);
	});

	test('getAvatarUrl throws if no email or openid', async () => {
		await assert.rejects(() => libravatar.getAvatarUrl({}), /must be provided/);
	});

	test('getAvatarUrl returns a valid URL for email', async () => {
		const url = await libravatar.getAvatarUrl({ email: knownEmail, https: true, s: 128 });
		assert.match(url, /^https:\/\/seccdn\.libravatar\.org\/avatar\/[a-f0-9]+\?s=128$/);
	});

	test('getAvatarUrl returns a valid URL for openid', async () => {
		const url = await libravatar.getAvatarUrl({
			openid: 'https://openid.example.com/user',
			https: false,
			d: 'retro',
		});
		assert.match(url, /^http:\/\/cdn\.libravatar\.org\/avatar\/[a-f0-9]+\?d=retro$/);
	});
});
