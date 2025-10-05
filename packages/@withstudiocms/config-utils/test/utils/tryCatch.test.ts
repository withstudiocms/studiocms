import { describe, expect, it } from 'vitest';
import { tryCatch } from '../../src/utils/index.js';

describe('tryCatch', () => {
	describe('with synchronous functions', () => {
		it('should return result and null error for successful sync function', async () => {
			const syncFn = () => 42;
			const [result, error] = await tryCatch(syncFn);
			expect(result).toBe(42);
			expect(error).toBeNull();
		});

		it('should return null result and error for throwing sync function', async () => {
			const throwingFn = () => {
				throw new Error('Sync error');
			};
			const [result, error] = await tryCatch(throwingFn);
			expect(result).toBeNull();
			expect(error).toBeInstanceOf(Error);
			expect(error?.message).toBe('Sync error');
		});

		it('should handle sync function returning different data types', async () => {
			const [stringResult] = await tryCatch(() => 'hello');
			expect(stringResult).toBe('hello');

			const [numberResult] = await tryCatch(() => 123);
			expect(numberResult).toBe(123);

			const obj = { foo: 'bar' };
			const [objectResult] = await tryCatch(() => obj);
			expect(objectResult).toBe(obj);

			const arr = [1, 2, 3];
			const [arrayResult] = await tryCatch(() => arr);
			expect(arrayResult).toEqual(arr);

			const [boolResult] = await tryCatch(() => true);
			expect(boolResult).toBe(true);

			const [nullResult] = await tryCatch(() => null);
			expect(nullResult).toBeNull();

			const [undefinedResult] = await tryCatch(() => undefined);
			expect(undefinedResult).toBeUndefined();
		});
	});

	describe('with asynchronous functions', () => {
		it('should return result and null error for successful async function', async () => {
			const asyncFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return 'async result';
			};
			const [result, error] = await tryCatch(asyncFn);
			expect(result).toBe('async result');
			expect(error).toBeNull();
		});

		it('should return null result and error for rejecting async function', async () => {
			const rejectingFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error('Async error');
			};
			const [result, error] = await tryCatch(rejectingFn);
			expect(result).toBeNull();
			expect(error).toBeInstanceOf(Error);
			expect(error?.message).toBe('Async error');
		});

		it('should handle function that returns a promise', async () => {
			const promiseReturningFn = () => Promise.resolve('promise result');
			const [result, error] = await tryCatch(promiseReturningFn);
			expect(result).toBe('promise result');
			expect(error).toBeNull();
		});

		it('should handle function that returns a rejecting promise', async () => {
			const rejectingPromiseFn = () => Promise.reject(new Error('Promise rejection'));
			const [result, error] = await tryCatch(rejectingPromiseFn);
			expect(result).toBeNull();
			expect(error).toBeInstanceOf(Error);
			expect(error?.message).toBe('Promise rejection');
		});
	});

	describe('with direct promise values', () => {
		it('should handle resolving promise directly', async () => {
			const promise = Promise.resolve('direct promise');
			const [result, error] = await tryCatch(promise);
			expect(result).toBe('direct promise');
			expect(error).toBeNull();
		});

		it('should handle rejecting promise directly', async () => {
			const promise = Promise.reject(new Error('Direct promise rejection'));
			const [result, error] = await tryCatch(promise);
			expect(result).toBeNull();
			expect(error).toBeInstanceOf(Error);
			expect(error?.message).toBe('Direct promise rejection');
		});

		it('should handle promise that resolves with different data types', async () => {
			const objPromise = Promise.resolve({ key: 'value' });
			const [objResult] = await tryCatch(objPromise);
			expect(objResult).toEqual({ key: 'value' });

			const arrPromise = Promise.resolve([1, 2, 3]);
			const [arrResult] = await tryCatch(arrPromise);
			expect(arrResult).toEqual([1, 2, 3]);

			const nullPromise = Promise.resolve(null);
			const [nullResult] = await tryCatch(nullPromise);
			expect(nullResult).toBeNull();
		});
	});

	describe('error handling and types', () => {
		it('should handle custom error types', async () => {
			class CustomError extends Error {
				constructor(
					message: string,
					public code: string
				) {
					super(message);
					this.name = 'CustomError';
				}
			}
			const throwingFn = () => {
				throw new CustomError('Custom error message', 'CUSTOM_CODE');
			};
			const [result, error] = await tryCatch(throwingFn);
			expect(result).toBeNull();
			expect(error).toBeInstanceOf(CustomError);
			expect(error?.message).toBe('Custom error message');
			expect((error as any).code).toBe('CUSTOM_CODE');
		});

		it('should handle non-Error throws', async () => {
			const throwingFn = () => {
				throw 'string error';
			};
			const [result, error] = await tryCatch(throwingFn);
			expect(result).toBeNull();
			expect(error).toBe('string error');
		});

		it('should handle thrown objects', async () => {
			const errorObj = { message: 'Object error', code: 500 };
			const throwingFn = () => {
				throw errorObj;
			};
			const [result, error] = await tryCatch(throwingFn);
			expect(result).toBeNull();
			expect(error).toBe(errorObj);
		});

		it('should handle thrown numbers', async () => {
			const throwingFn = () => {
				throw 404;
			};
			const [result, error] = await tryCatch(throwingFn);
			expect(result).toBeNull();
			expect(error).toBe(404);
		});
	});

	describe('edge cases', () => {
		it('should handle function that returns undefined', async () => {
			const undefinedFn = () => undefined;
			const [result, error] = await tryCatch(undefinedFn);
			expect(result).toBeUndefined();
			expect(error).toBeNull();
		});

		it('should handle function that returns null', async () => {
			const nullFn = () => null;
			const [result, error] = await tryCatch(nullFn);
			expect(result).toBeNull();
			expect(error).toBeNull();
		});

		it('should handle async function that returns undefined', async () => {
			const asyncUndefinedFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return undefined;
			};
			const [result, error] = await tryCatch(asyncUndefinedFn);
			expect(result).toBeUndefined();
			expect(error).toBeNull();
		});

		it('should handle promise that resolves to undefined', async () => {
			const promise = Promise.resolve(undefined);
			const [result, error] = await tryCatch(promise);
			expect(result).toBeUndefined();
			expect(error).toBeNull();
		});

		it('should handle very long running operations', async () => {
			const slowFn = async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return 'slow result';
			};
			const [result, error] = await tryCatch(slowFn);
			expect(result).toBe('slow result');
			expect(error).toBeNull();
		});
	});

	describe('real-world usage examples', () => {
		it('should handle file system operations', async () => {
			const readFile = async (path: string) => {
				if (path === '/valid/path') {
					return 'file contents';
				}
				throw new Error(`ENOENT: no such file or directory, open '${path}'`);
			};
			const [content, readError] = await tryCatch(() => readFile('/valid/path'));
			expect(content).toBe('file contents');
			expect(readError).toBeNull();

			const [failedContent, failedError] = await tryCatch(() => readFile('/invalid/path'));
			expect(failedContent).toBeNull();
			expect(failedError).toBeInstanceOf(Error);
			expect(failedError?.message).toMatch(/ENOENT/);
		});

		it('should handle JSON parsing', async () => {
			const parseJSON = (str: string) => JSON.parse(str);

			const [validResult] = await tryCatch(() => parseJSON('{"key": "value"}'));
			expect(validResult).toEqual({ key: 'value' });

			const [invalidResult, parseError] = await tryCatch(() => parseJSON('invalid json'));
			expect(invalidResult).toBeNull();
			expect(parseError).toBeInstanceOf(SyntaxError);
		});

		it('should handle network requests simulation', async () => {
			const fetchData = async (url: string) => {
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

			const [successData] = await tryCatch(() => fetchData('http://example.com/success'));
			expect(successData).toEqual({ data: 'success response' });

			const [failedData, networkError] = await tryCatch(() => fetchData('http://example.com/fail'));
			expect(failedData).toBeNull();
			expect(networkError).toBeInstanceOf(Error);
			expect(networkError?.message).toBe('Network error');
		});
	});
});
