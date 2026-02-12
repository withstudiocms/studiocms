import { Pretty, Schema } from 'effect';
import { FunctionSchema } from '../src/schemas';

const LoginSchema = FunctionSchema(
	Schema.Struct({ username: Schema.String, password: Schema.String }),
	Schema.Boolean
);

const PrettyLoginSchema = Pretty.make(LoginSchema);

const rawLoginFn = async (data: { username: string; password: string }) => {
	return data.username === 'admin' && data.password === '123';
};

const prettyLoginFn = PrettyLoginSchema(rawLoginFn);

console.log(prettyLoginFn); // [Function: prettyLoginFn]

// Decode wraps the raw function with validation
const validatedLogin = Schema.decodeSync(LoginSchema)(rawLoginFn);

// Now when you call validatedLogin, it validates inputs and outputs
const result = await validatedLogin({ username: 'admin', password: '123' }); // true

console.log(result); // true
