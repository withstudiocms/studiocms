import assert from 'node:assert';
import { describe, it } from 'node:test';
import { tryCatch } from '../../dist/utils/tryCatch.js';

describe('tryCatch', () => {
	describe('with synchronous functions', () => {
		it('should return result and null error for successful sync function', async () => {
			const syncFn = () => 42;

			const [result, error] = await tryCatch(syncFn);

			assert.strictEqual(result, 42);
			assert.strictEqual(error, null);
		});

		it('should return null result and error for throwing sync function', async () => {
			const throwingFn = () => {
				throw new Error('Sync error');
			};

			const [result, error] = await tryCatch(throwingFn);

			assert.strictEqual(result, null);
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'Sync error');
		});

		it('should handle sync function returning different data types', async () => {
			// String
			const [stringResult] = await tryCatch(() => 'hello');
			assert.strictEqual(stringResult, 'hello');

			// Number
			const [numberResult] = await tryCatch(() => 123);
			assert.strictEqual(numberResult, 123);

			// Object
			const obj = { foo: 'bar' };
			const [objectResult] = await tryCatch(() => obj);
			assert.strictEqual(objectResult, obj);

			// Array
			const arr = [1, 2, 3];
			const [arrayResult] = await tryCatch(() => arr);
			assert.deepStrictEqual(arrayResult, arr);

			// Boolean
			const [boolResult] = await tryCatch(() => true);
			assert.strictEqual(boolResult, true);

			// Null
			const [nullResult] = await tryCatch(() => null);
			assert.strictEqual(nullResult, null);

			// Undefined
			const [undefinedResult] = await tryCatch(() => undefined);
			assert.strictEqual(undefinedResult, undefined);
		});
	});

	describe('with asynchronous functions', () => {
		it('should return result and null error for successful async function', async () => {
			const asyncFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'async result';
			};

			const [result, error] = await tryCatch(asyncFn);

			assert.strictEqual(result, 'async result');
			assert.strictEqual(error, null);
		});

		it('should return null result and error for rejecting async function', async () => {
			const rejectingFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error('Async error');
			};

			const [result, error] = await tryCatch(rejectingFn);

			assert.strictEqual(result, null);
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'Async error');
		});

		it('should handle function that returns a promise', async () => {
			const promiseReturningFn = () => Promise.resolve('promise result');

			const [result, error] = await tryCatch(promiseReturningFn);

			assert.strictEqual(result, 'promise result');
			assert.strictEqual(error, null);
		});

		it('should handle function that returns a rejecting promise', async () => {
			const rejectingPromiseFn = () => Promise.reject(new Error('Promise rejection'));

			const [result, error] = await tryCatch(rejectingPromiseFn);

			assert.strictEqual(result, null);
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'Promise rejection');
		});
	});

	describe('with direct promise values', () => {
		it('should handle resolving promise directly', async () => {
			const promise = Promise.resolve('direct promise');

			const [result, error] = await tryCatch(promise);

			assert.strictEqual(result, 'direct promise');
			assert.strictEqual(error, null);
		});

		it('should handle rejecting promise directly', async () => {
			const promise = Promise.reject(new Error('Direct promise rejection'));

			const [result, error] = await tryCatch(promise);

			assert.strictEqual(result, null);
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'Direct promise rejection');
		});

		it('should handle promise that resolves with different data types', async () => {
			// Object promise
			const objPromise = Promise.resolve({ key: 'value' });
			const [objResult] = await tryCatch(objPromise);
			assert.deepStrictEqual(objResult, { key: 'value' });

			// Array promise
			const arrPromise = Promise.resolve([1, 2, 3]);
			const [arrResult] = await tryCatch(arrPromise);
			assert.deepStrictEqual(arrResult, [1, 2, 3]);

			// Null promise
			const nullPromise = Promise.resolve(null);
			const [nullResult] = await tryCatch(nullPromise);
			assert.strictEqual(nullResult, null);
		});
	});

	describe('error handling and types', () => {
		it('should handle custom error types', async () => {
			class CustomError extends Error {
				constructor(message, code) {
					super(message);
					this.name = 'CustomError';
					this.code = code;
				}
			}

			const throwingFn = () => {
				throw new CustomError('Custom error message', 'CUSTOM_CODE');
			};

			const [result, error] = await tryCatch(throwingFn);

			assert.strictEqual(result, null);
			assert.ok(error instanceof CustomError);
			assert.strictEqual(error.message, 'Custom error message');
			assert.strictEqual(error.code, 'CUSTOM_CODE');
		});

		it('should handle non-Error throws', async () => {
			const throwingFn = () => {
				throw 'string error';
			};

			const [result, error] = await tryCatch(throwingFn);

			assert.strictEqual(result, null);
			assert.strictEqual(error, 'string error');
		});

		it('should handle thrown objects', async () => {
			const errorObj = { message: 'Object error', code: 500 };
			const throwingFn = () => {
				throw errorObj;
			};

			const [result, error] = await tryCatch(throwingFn);

			assert.strictEqual(result, null);
			assert.strictEqual(error, errorObj);
		});

		it('should handle thrown numbers', async () => {
			const throwingFn = () => {
				throw 404;
			};

			const [result, error] = await tryCatch(throwingFn);

			assert.strictEqual(result, null);
			assert.strictEqual(error, 404);
		});
	});

	describe('edge cases', () => {
		it('should handle function that returns undefined', async () => {
			const undefinedFn = () => undefined;

			const [result, error] = await tryCatch(undefinedFn);

			assert.strictEqual(result, undefined);
			assert.strictEqual(error, null);
		});

		it('should handle function that returns null', async () => {
			const nullFn = () => null;

			const [result, error] = await tryCatch(nullFn);

			assert.strictEqual(result, null);
			assert.strictEqual(error, null);
		});

		it('should handle async function that returns undefined', async () => {
			const asyncUndefinedFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return undefined;
			};

			const [result, error] = await tryCatch(asyncUndefinedFn);

			assert.strictEqual(result, undefined);
			assert.strictEqual(error, null);
		});

		it('should handle promise that resolves to undefined', async () => {
			const promise = Promise.resolve(undefined);

			const [result, error] = await tryCatch(promise);

			assert.strictEqual(result, undefined);
			assert.strictEqual(error, null);
		});

		it('should handle very long running operations', async () => {
			const slowFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return 'slow result';
			};

			const [result, error] = await tryCatch(slowFn);

			assert.strictEqual(result, 'slow result');
			assert.strictEqual(error, null);
		});
	});

	describe('real-world usage examples', () => {
		it('should handle file system operations', async () => {
			// Simulate a file read operation
			const readFile = async (path) => {
				if (path === '/valid/path') {
					return 'file contents';
				}
				throw new Error(`ENOENT: no such file or directory, open '${path}'`);
			};

			// Successful read
			const [content, readError] = await tryCatch(() => readFile('/valid/path'));
			assert.strictEqual(content, 'file contents');
			assert.strictEqual(readError, null);

			// Failed read
			const [failedContent, failedError] = await tryCatch(() => readFile('/invalid/path'));
			assert.strictEqual(failedContent, null);
			assert.ok(failedError instanceof Error);
			assert.ok(failedError.message.includes('ENOENT'));
		});

		it('should handle JSON parsing', async () => {
			const parseJSON = (str) => JSON.parse(str);

			// Valid JSON
			const [validResult] = await tryCatch(() => parseJSON('{"key": "value"}'));
			assert.deepStrictEqual(validResult, { key: 'value' });

			// Invalid JSON
			const [invalidResult, parseError] = await tryCatch(() => parseJSON('invalid json'));
			assert.strictEqual(invalidResult, null);
			assert.ok(parseError instanceof SyntaxError);
		});

		it('should handle network requests simulation', async () => {
			const fetchData = async (url) => {
				if (url.includes('success')) {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return { data: 'success response' };
				}
				if (url.includes('timeout')) {
					await new Promise((resolve) => setTimeout(resolve, 10));
					throw new Error('Request timeout');
				}
				throw new Error('Network error');
			};

			// Successful request
			const [successData] = await tryCatch(() => fetchData('http://example.com/success'));
			assert.deepStrictEqual(successData, { data: 'success response' });

			// Failed request
			const [failedData, networkError] = await tryCatch(() => fetchData('http://example.com/fail'));
			assert.strictEqual(failedData, null);
			assert.strictEqual(networkError.message, 'Network error');
		});
	});
});
