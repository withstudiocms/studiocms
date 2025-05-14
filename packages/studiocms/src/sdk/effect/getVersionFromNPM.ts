import { FetchHttpClient, HttpClient, HttpClientResponse } from '@effect/platform';
import { Effect, Schedule, Schema } from 'effect';

export class NpmVersion extends Schema.Class<NpmVersion>('NpmVersion')({
	version: Schema.String,
}) {}

export class GetVersionFromNPM extends Effect.Service<GetVersionFromNPM>()(
	'studiocms/sdk/effect/GetVersionFromNPM',
	{
		effect: Effect.gen(function* () {
			const httpClient = (yield* HttpClient.HttpClient).pipe(
				HttpClient.retryTransient({
					times: 3,
					schedule: Schedule.spaced('1 second'),
				})
			);

			const get = (pkg: string, ver = 'latest') =>
				Effect.gen(function* () {
					const response = yield* httpClient
						.get(`https://registry.npmjs.org/${pkg}/${ver}`)
						.pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(NpmVersion)));
					return response.version;
				});

			return { get };
		}),
		dependencies: [FetchHttpClient.layer],
	}
) {}
