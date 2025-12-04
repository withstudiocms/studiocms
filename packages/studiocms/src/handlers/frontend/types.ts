import type { AstroIntegrationMiddleware, InjectedRoute } from 'astro';

/**
 * Injected Routes with Middleware Interface
 */
export interface InjectedRoutesWithMiddleware {
	routes: InjectedRoute[];
	middleware: AstroIntegrationMiddleware[];
}

/**
 * Processed Route Configuration
 */
export interface ProcessedRouteConfig {
	dbStartPage: boolean;
	shouldInject404Route: boolean;
	restAPIEnabled: boolean;
	dashboardEnabled: boolean;
	dashboardAPIEnabled: boolean;
	usernameAndPasswordAPI: boolean;
	userRegistrationEnabled: boolean;
	oAuthEnabled: boolean;
}

/**
 * Configuration interface for StudioCMS routes.
 */
export interface RouteConfig {
	dbStartPage: boolean;
	shouldInject404Route: boolean;
	dashboardEnabled: boolean;
	oAuthProvidersConfigured: boolean;
	extraRoutes: InjectedRoute[];
	developerConfig: {
		demoMode:
			| false
			| {
					username: string;
					password: string;
			  };
	};
	authConfig: {
		enabled: boolean;
		providers: {
			usernameAndPassword: boolean;
			usernameAndPasswordConfig: { allowUserRegistration: boolean };
		};
	};
	dashboardRoute: (path: string) => string;
}
