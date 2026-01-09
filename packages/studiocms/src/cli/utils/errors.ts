import { Data } from 'effect';

export class StudioCMSCliError extends Data.TaggedError('StudioCMSCliError')<{
	message: string;
	cause?: unknown;
}> {}
