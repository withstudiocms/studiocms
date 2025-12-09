interface StudioCMSLocals {
	SCMSGenerator: string;
	SCMSUiGenerator: string;
}

declare namespace App {
	interface Locals {
		StudioCMS: StudioCMSLocals;
	}
}
