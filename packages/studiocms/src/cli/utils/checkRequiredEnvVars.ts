export const checkRequiredEnvVars = (envVars: string[]) => {
    for (const varName of envVars) {
        if (!process.env[varName]) {
            console.error(
                `${varName} is a required environment variable when using this utility.`
            );
            process.exit(1);
        }
    }
}