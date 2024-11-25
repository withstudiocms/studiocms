import type { ExpiringBucket, RefillBucket, ThrottlingCounter } from './types';
// TODO: Implement rate limiting for auth API routes

/**
 * Represents a token bucket that refills tokens at a specified interval.
 * Used to control access to resources by limiting the number of tokens
 * that can be consumed over time.
 *
 * @template _Key - The type of key used to identify individual token buckets.
 */
export class RefillingTokenBucket<_Key> {
	/**
	 * The maximum number of tokens that the bucket can hold.
	 * @type {number}
	 */
	public max: number;

	/**
	 * The interval in seconds at which tokens are refilled.
	 * @type {number}
	 */
	public refillIntervalSeconds: number;

	/**
	 * Initializes a new instance of the RefillingTokenBucket class.
	 *
	 * @param {number} max - The maximum number of tokens the bucket can hold.
	 * @param {number} refillIntervalSeconds - The refill interval in seconds.
	 */
	constructor(max: number, refillIntervalSeconds: number) {
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
	}

	/**
	 * A map storing individual token buckets associated with specific keys.
	 * @private
	 */
	private storage = new Map<_Key, RefillBucket>();

	/**
	 * Checks if there are enough tokens available in the bucket for the specified key and cost.
	 *
	 * @param {_Key} key - The key associated with the token bucket.
	 * @param {number} cost - The number of tokens required.
	 * @returns {boolean} - Returns `true` if there are enough tokens; otherwise, `false`.
	 */
	public check(key: _Key, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		if (bucket === null) {
			return true;
		}
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		if (refill > 0) {
			return Math.min(bucket.count + refill, this.max) >= cost;
		}
		return bucket.count >= cost;
	}

	/**
	 * Consumes tokens from the bucket for the specified key and cost.
	 *
	 * @param {_Key} key - The key associated with the token bucket.
	 * @param {number} cost - The number of tokens to consume.
	 * @returns {boolean} - Returns `true` if tokens were successfully consumed; otherwise, `false`.
	 */
	public consume(key: _Key, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				refilledAt: now,
			};
			this.storage.set(key, bucket);
			return true;
		}
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
		bucket.count = Math.min(bucket.count + refill, this.max);
		bucket.refilledAt = now;
		if (bucket.count < cost) {
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}
}

/**
 * Represents a throttler that limits the frequency of actions performed with a specified key.
 * Uses incremental timeouts to delay repeated actions.
 *
 * @template _Key - The type of key used to identify throttling counters.
 */
export class Throttler<_Key> {
	/**
	 * Array of timeout durations (in seconds) for each consecutive attempt.
	 * @type {number[]}
	 */
	public timeoutSeconds: number[];

	/**
	 * A map storing individual throttling counters associated with specific keys.
	 * @private
	 */
	private storage = new Map<_Key, ThrottlingCounter>();

	/**
	 * Initializes a new instance of the Throttler class.
	 *
	 * @param {number[]} timeoutSeconds - Array of timeout durations in seconds for each consecutive attempt.
	 */
	constructor(timeoutSeconds: number[]) {
		this.timeoutSeconds = timeoutSeconds;
	}

	/**
	 * Attempts to consume an action for the specified key.
	 *
	 * @param {_Key} key - The key associated with the throttling counter.
	 * @returns {boolean} - Returns `true` if the action is allowed; otherwise, `false`.
	 */
	public consume(key: _Key): boolean {
		let counter = this.storage.get(key) ?? null;
		const now = Date.now();
		if (counter === null) {
			counter = {
				timeout: 0,
				updatedAt: now,
			};
			this.storage.set(key, counter);
			return true;
		}
		// @ts-expect-error: Could be undefined
		const allowed = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;
		if (!allowed) {
			return false;
		}
		counter.updatedAt = now;
		counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
		this.storage.set(key, counter);
		return true;
	}

	/**
	 * Resets the throttling counter for a specified key.
	 *
	 * @param {_Key} key - The key associated with the throttling counter to reset.
	 */
	public reset(key: _Key): void {
		this.storage.delete(key);
	}
}

/**
 * Represents a token bucket with tokens that expire after a specified duration.
 * Used to control access to resources with tokens that reset after expiration.
 *
 * @template _Key - The type of key used to identify individual token buckets.
 */
export class ExpiringTokenBucket<_Key> {
	/**
	 * The maximum number of tokens the bucket can hold.
	 * @type {number}
	 */
	public max: number;

	/**
	 * The duration (in seconds) after which tokens in the bucket expire.
	 * @type {number}
	 */
	public expiresInSeconds: number;

	/**
	 * A map storing individual expiring token buckets associated with specific keys.
	 * @private
	 */
	private storage = new Map<_Key, ExpiringBucket>();

	/**
	 * Initializes a new instance of the ExpiringTokenBucket class.
	 *
	 * @param {number} max - The maximum number of tokens the bucket can hold.
	 * @param {number} expiresInSeconds - The duration in seconds after which tokens expire.
	 */
	constructor(max: number, expiresInSeconds: number) {
		this.max = max;
		this.expiresInSeconds = expiresInSeconds;
	}

	/**
	 * Checks if there are enough tokens available in the bucket for the specified key and cost.
	 *
	 * @param {_Key} key - The key associated with the token bucket.
	 * @param {number} cost - The number of tokens required.
	 * @returns {boolean} - Returns `true` if there are enough tokens or if the tokens have expired; otherwise, `false`.
	 */
	public check(key: _Key, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			return true;
		}
		return bucket.count >= cost;
	}

	/**
	 * Consumes tokens from the bucket for the specified key and cost.
	 *
	 * @param {_Key} key - The key associated with the token bucket.
	 * @param {number} cost - The number of tokens to consume.
	 * @returns {boolean} - Returns `true` if tokens were successfully consumed; otherwise, `false`.
	 */
	public consume(key: _Key, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				createdAt: now,
			};
			this.storage.set(key, bucket);
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			bucket.count = this.max;
		}
		if (bucket.count < cost) {
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}

	/**
	 * Resets the token bucket for a specified key, removing all tokens.
	 *
	 * @param {_Key} key - The key associated with the token bucket to reset.
	 */
	public reset(key: _Key): void {
		this.storage.delete(key);
	}
}
