import { Data } from 'effect';

export class StudioCMSAPIError extends Data.TaggedError('StudioCMSAPIError')<{
	message: string;
	cause?: unknown;
}> {}
