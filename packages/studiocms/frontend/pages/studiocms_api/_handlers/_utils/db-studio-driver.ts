import { Data, Effect } from 'effect';
import { type BaseDriver, getDriver } from '#toolbar/db-studio';

/**
 * Custom error class used for quick escaping from deep error handling in the Effect chain.
 */
export class DriverError extends Data.TaggedError('DriverError')<{ message: string }> {}

// Singleton instance of the database driver
let driver: BaseDriver | undefined;

/**
 * Utility function to wrap driver-related promises and convert any errors into DriverError instances for consistent error handling in the Effect chain.
 *
 * @param _try A function that returns a promise for a driver-related operation.
 * @returns An Effect that resolves with the result of the promise or fails with a DriverError if the promise rejects.
 */
export const useDriverErrorPromise = <T>(_try: () => Promise<T>) =>
	Effect.tryPromise({
		try: _try,
		catch: (error) =>
			new DriverError({ message: error instanceof Error ? error.message : String(error) }),
	});

/**
 * Retrieves the singleton instance of the database driver, initializing it if it hasn't been created yet. If any step in the retrieval or initialization process fails, it returns a DriverError with details about the failure.
 *
 * @returns An Effect that resolves with the initialized database driver or fails with a DriverError if the driver cannot be retrieved or initialized.
 */
export const getDriverInstance = Effect.fn('getDriverInstance')(function* () {
	// Return existing driver if already initialized
	if (driver) return driver;

	// Attempt to get and initialize the driver
	driver = yield* useDriverErrorPromise(() => getDriver()).pipe(
		Effect.tap((drv) => useDriverErrorPromise(() => drv.init()))
	);

	// If driver is still undefined, return an error
	if (!driver) {
		return yield* new DriverError({ message: 'Failed to get database driver' });
	}

	// Return the initialized driver
	return driver;
});
