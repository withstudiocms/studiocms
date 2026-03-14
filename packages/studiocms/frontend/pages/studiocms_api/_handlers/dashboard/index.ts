import { HttpApiBuilder } from '@effect/platform';
import { StudioCMSDashboardApiSpec } from '@withstudiocms/api-spec';
import { Layer } from 'effect';
import { AstroLocalsAuthLive } from '../../_middleware/astroLocals.js';
import { ApiTokensHandler } from './apiTokens.js';
import { ConfigHandlers } from './config.js';
import { ContentHandlers } from './content.js';
import { CreateHandlers } from './create.js';
import { EmailNotificationHandlers } from './emailNotifications.js';
import { MailerHandlers } from './mailer.js';
import { PluginHandlers } from './plugins.js';
import { ProfileHandlers } from './profile.js';
import { ResetPasswordHandlers } from './resetPassword.js';
import { SearchHandlers } from './search.js';
import { TaxonomyHandlers } from './taxonomy.js';
import { TemplatesHandlers } from './templates.js';
import { UsersHandlers } from './users.js';
import { VerifyEndpointsHandlers } from './verifyEndpoints.js';

/**
 * Combined Dashboard API Handlers.
 */
export const DashboardAPIHandlers = Layer.mergeAll(
	ApiTokensHandler,
	ConfigHandlers,
	ContentHandlers,
	CreateHandlers,
	EmailNotificationHandlers,
	MailerHandlers,
	PluginHandlers,
	ProfileHandlers,
	ResetPasswordHandlers,
	SearchHandlers,
	TaxonomyHandlers,
	TemplatesHandlers,
	UsersHandlers,
	VerifyEndpointsHandlers
).pipe(Layer.provide(AstroLocalsAuthLive));

/**
 * Live implementation of the Dashboard API Handlers.
 */
export const DashboardAPILive = HttpApiBuilder.api(StudioCMSDashboardApiSpec).pipe(
	Layer.provide(DashboardAPIHandlers)
);
