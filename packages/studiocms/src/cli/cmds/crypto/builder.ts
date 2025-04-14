/* 
    Based on `jwt-builder` by Vandium-io
    
    Builds JSON Web Token (JWT) programatically

Copyright (c) 2016, Vandium Software Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Vandium Software Inc. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


*/

import fs from 'node:fs';
import jwt from './jwt.js';

// Algorithm types
type Algorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256';

const ALGORITHM_HS256: Algorithm = 'HS256';
const ALGORITHM_HS384: Algorithm = 'HS384';
const ALGORITHM_HS512: Algorithm = 'HS512';
const ALGORITHM_RS256: Algorithm = 'RS256';

const JAN_1_2016 = 1451606400;

// JWT Claims interface
interface JWTClaims {
	[key: string]: string | number | boolean | object;
}

// JWT Headers interface
interface JWTHeaders {
	[key: string]: string | number | boolean | object;
}

// Configuration interface
interface JWTConfig {
	algorithm?: Algorithm;
	secret?: string;
	privateKey?: string | Buffer;
	exp?: number;
	iat?: number | boolean;
	nbf?: number | boolean;
	headers?: JWTHeaders;
	[key: string]: string | number | boolean | object | undefined;
}

// Time offset result interface
interface TimeOffset {
	value: number;
	relative: boolean;
}

function nowInSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

function offsetTimeValue(value?: number): TimeOffset {
	let relative: boolean;

	if (value === undefined) {
		value = 0;
		relative = true;
	} else {
		value = Math.floor(value);
		relative = value < JAN_1_2016;
	}

	return {
		value: value,
		relative: relative,
	};
}

function addClaimTimeValue(
	claims: JWTClaims,
	name: string,
	value: number | undefined,
	relative: boolean
): void {
	if (value !== undefined) {
		if (relative) {
			value += nowInSeconds();
		}

		claims[name] = value;
	}
}

function setFromConfig(builder: JWTTokenBuilder, config?: JWTConfig): void {
	if (!config) {
		return;
	}

	const claims: JWTClaims = {};

	// biome-ignore lint/complexity/noForEach: <explanation>
	Object.keys(config).forEach((key) => {
		const value = config[key];

		switch (key) {
			case 'algorithm':
				if (typeof value === 'string') {
					builder.algorithm(value as Algorithm);
				}
				break;
			case 'secret':
				if (typeof value === 'string') {
					builder.secret(value);
				}
				break;
			case 'privateKey':
				if (typeof value === 'string' || Buffer.isBuffer(value)) {
					builder.privateKey(value);
				}
				break;
			case 'exp':
				if (typeof value === 'number') {
					builder.exp(value);
				}
				break;
			case 'iat':
				if (value === true) {
					builder.iat();
				} else if (value !== false && typeof value === 'number') {
					builder.iat(value);
				}
				break;
			case 'nbf':
				if (value === true) {
					builder.nbf();
				} else if (value !== false && typeof value === 'number') {
					builder.nbf(value);
				}
				break;
			case 'headers':
				if (typeof value === 'object' && value !== null) {
					builder.headers(value as JWTHeaders);
				}
				break;
			default:
				claims[key] = value as string | number | boolean | object;
				break;
		}
	});

	builder.claims(claims);
}

class JWTTokenBuilder {
	private _algorithm: Algorithm;
	private _claims: JWTClaims;
	private _headers?: JWTHeaders;
	private _secret?: string;
	private _key?: string | Buffer;
	private _iat?: number;
	private _iat_relative?: boolean;
	private _nbf?: number;
	private _nbf_relative?: boolean;
	private _exp?: number;

	constructor(config?: JWTConfig) {
		this._algorithm = ALGORITHM_HS256;
		this._claims = {};

		setFromConfig(this, config);
	}

	claims(userClaims: JWTClaims): JWTTokenBuilder {
		this._claims = Object.assign({}, userClaims);

		return this;
	}

	headers(userHeaders: JWTHeaders): JWTTokenBuilder {
		this._headers = Object.assign({}, userHeaders);

		return this;
	}

	algorithm(alg: Algorithm): JWTTokenBuilder {
		switch (alg) {
			case ALGORITHM_HS256:
			case ALGORITHM_HS384:
			case ALGORITHM_HS512:
			case ALGORITHM_RS256:
				this._algorithm = alg;
				break;

			default:
				throw new Error(`unknown algorithm: ${alg}`);
		}

		return this;
	}

	secret(sec: string): JWTTokenBuilder {
		this._secret = sec;

		return this;
	}

	privateKey(key: string | Buffer): JWTTokenBuilder {
		this._key = key;

		return this;
	}

	privateKeyFromFile(filePath: string): JWTTokenBuilder {
		return this.privateKey(fs.readFileSync(filePath));
	}

	iat(value?: number): JWTTokenBuilder {
		const result = offsetTimeValue(value);

		this._iat = result.value;
		this._iat_relative = result.relative;

		return this;
	}

	nbf(value?: number): JWTTokenBuilder {
		const result = offsetTimeValue(value);

		this._nbf = result.value;
		this._nbf_relative = result.relative;

		return this;
	}

	exp(value: number): JWTTokenBuilder {
		this._exp = Math.floor(value);

		return this;
	}

	build(): string {
		let keyOrSecret: string | Buffer;

		if (this._algorithm === ALGORITHM_RS256) {
			if (!this._key) {
				throw new Error('missing private key');
			}

			keyOrSecret = this._key;
		} else {
			if (!this._secret) {
				throw new Error('missing secret');
			}

			keyOrSecret = this._secret;
		}

		const jwtClaims: JWTClaims = {};

		addClaimTimeValue(jwtClaims, 'iat', this._iat, this._iat_relative ?? false);
		addClaimTimeValue(jwtClaims, 'nbf', this._nbf, this._nbf_relative ?? false);
		addClaimTimeValue(jwtClaims, 'exp', this._exp, true);

		Object.assign(jwtClaims, this._claims);

		const additional: { header?: JWTHeaders } = {};

		if (this._headers) {
			additional.header = this._headers;
		}

		return jwt.encode(jwtClaims, keyOrSecret, this._algorithm, additional);
	}
}

export {
	JWTTokenBuilder,
	ALGORITHM_HS256,
	ALGORITHM_HS384,
	ALGORITHM_HS512,
	ALGORITHM_RS256,
	type Algorithm,
	type JWTClaims,
	type JWTHeaders,
	type JWTConfig,
};
