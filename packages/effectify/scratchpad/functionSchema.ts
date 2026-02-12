import { Schema } from 'effect';
import { FunctionSchema } from '../src/schemas';

/**
 * Example usage of the FunctionSchema to create a validated function schema for a login function.
 */
const LoginSchema = FunctionSchema(
	Schema.Struct({ username: Schema.String, password: Schema.String }),
	Schema.Boolean
);
//   ^ Schema.Schema<(args: { readonly username: string; readonly password: string; }) => Promise<boolean>, (args: { readonly username: string; readonly password: string; }) => Promise<boolean>, never>

/**
 * Create a raw function that matches the expected input and output types of the schema. In this case, it's an async function that checks if the username and password are correct.
 */
const rawLoginFn = async (data: { username: string; password: string }) => {
	return data.username === 'admin' && data.password === '123';
};
//    ^ rawLoginFn: (data: { username: string; password: string; }) => Promise<boolean>

/**
 * Now we decode the raw function using the FunctionSchema. This will give us a new function that has runtime validation for both its inputs and outputs based on the provided schemas.
 */
const validatedLogin = Schema.decodeSync(LoginSchema)(rawLoginFn);
//    ^ validatedLogin: (args: { readonly username: string; readonly password: string; }) => Promise<boolean>

/**
 * Now we can call the validatedLogin function with the correct input. The schema will ensure that the input matches the expected structure and that the output is a boolean.
 */
const result = await validatedLogin({ username: 'admin', password: '123' });
//    ^ result: boolean

/**
 * Console log the result to verify that it works as expected. In this case, it should log 'true' since the username and password are correct.
 */
console.log(result);
//   ^ Logs: true
