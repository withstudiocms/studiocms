import { Data, Effect } from 'effect';
import { type BaseDriver, getDriver } from '#toolbar/db-studio';

export class DriverError extends Data.TaggedError('DriverError')<{ message: string }> {}

let driver: BaseDriver | undefined;

export const useDriverErrorPromise = <T>(_try: () => Promise<T>) =>
	Effect.tryPromise({
		try: _try,
		catch: (error) =>
			new DriverError({ message: error instanceof Error ? error.message : String(error) }),
	});

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
