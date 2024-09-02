import fileFactory from '@matthiesenxyz/integration-utils/fileFactory';

const authconfigDTS = fileFactory();

authconfigDTS.addLines('// This file is generated by StudioCMS\n\n');

authconfigDTS.addLines(`declare module 'studiocms:auth/config' {`);
authconfigDTS.addLines(
	`	const AuthSecurityConfig: import('@studiocms/core').usernameAndPasswordConfig;`
);
authconfigDTS.addLines('	export default AuthSecurityConfig;');
authconfigDTS.addLines('}');

const DTSFile = authconfigDTS.text();

export default DTSFile;