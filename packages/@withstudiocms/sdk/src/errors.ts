import { Data } from '@withstudiocms/effect';

export class StudioCMSSDKError extends Data.TaggedError('StudioCMSSDKError')<{
	message: string;
	cause?: unknown;
}> {}
