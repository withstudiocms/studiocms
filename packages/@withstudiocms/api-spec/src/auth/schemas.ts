import { Schema } from 'effect';

export const AuthAPISuccess = Schema.Struct({
	message: Schema.String,
});

export const AuthAPIErrorSchema = Schema.Struct({
	error: Schema.String,
});
