import * as Schema from 'effect/Schema';

export const Spider360 = Schema.Literal('360Spider', '360Spider-Image', '360Spider-Video');
export const HaoSouSpider = Schema.Literal('HaoSouSpider');
export const AdsBotGoogle = Schema.Literal(
	'AdsBot-Google',
	'AdsBot-Google-Mobile',
	'AdsBot-Google-Mobile-Apps'
);
export const Googlebot = Schema.Literal(
	'Googlebot',
	'Googlebot-Image',
	'Googlebot-Mobile',
	'Googlebot-News',
	'Googlebot-Video'
);
export const MediapartnersGoogle = Schema.Literal('Mediapartners-Google');
export const adidxbot = Schema.Literal('adidxbot');
export const bingbot = Schema.Literal('bingbot');
export const BingPreview = Schema.Literal('BingPreview');
export const MicrosoftPreview = Schema.Literal('MicrosoftPreview');
export const msnbot = Schema.Literal('msnbot', 'msnbot-media');
export const Applebot = Schema.Literal('Applebot', 'AppleNewsBot');
export const Baiduspider = Schema.Literal(
	'Baiduspider',
	'Baiduspider-image',
	'Baiduspider-mobile',
	'Baiduspider-news',
	'Baiduspider-video'
);
export const coccoc = Schema.Literal('coccoc', 'coccocbot-image', 'coccocbot-web');
export const DuckDuckBot = Schema.Literal('DuckDuckBot', 'DuckDuckGo-Favicons-Bot');
export const facebook = Schema.Literal('facebookcatalog', 'facebookexternalhit', 'Facebot');
export const gooblog = Schema.Literal('gooblog');
export const ichiro = Schema.Literal('ichiro');
export const Sogou = Schema.Literal(
	'Sogou blog',
	'Sogou inst spider',
	'Sogou News Spider',
	'Sogou Orion spider',
	'Sogou spider2',
	'Sogou web spider'
);
export const Yandex = Schema.Literal('Yandex', 'YandexMobileBot');
export const AlgoliaCrawler = Schema.Literal('Algolia Crawler');
export const BublupBot = Schema.Literal('BublupBot');
export const CCBot = Schema.Literal('CCBot');
export const Cliqzbot = Schema.Literal('Cliqzbot');
export const Daumoa = Schema.Literal('Daumoa');
export const DeuSu = Schema.Literal('DeuSu');
export const EuripBot = Schema.Literal('EuripBot');
export const Exploratodo = Schema.Literal('Exploratodo');
export const Feedly = Schema.Literal('Feedly');
export const Findxbot = Schema.Literal('Findxbot');
export const istellabot = Schema.Literal('istellabot');
export const JikeSpider = Schema.Literal('JikeSpider');
export const Lycos = Schema.Literal('Lycos');
export const MailRu = Schema.Literal('Mail.Ru');
export const MojeekBot = Schema.Literal('MojeekBot');
export const OrangeBot = Schema.Literal('OrangeBot');
export const Pinterest = Schema.Literal('Pinterest');
export const Plukkie = Schema.Literal('Plukkie');
export const Qwantify = Schema.Literal('Qwantify');
export const Rambler = Schema.Literal('Rambler');
export const SemanticScholarBot = Schema.Literal('SemanticScholarBot');
export const SeSchemanamBot = Schema.Literal('SeSchemanamBot');
export const Sosospider = Schema.Literal('Sosospider');
export const Slurp = Schema.Literal('Slurp');
export const Twitterbot = Schema.Literal('Twitterbot');
export const WhatsApp = Schema.Literal('WhatsApp');
export const yacybot = Schema.Literal('yacybot');
export const YepBot = Schema.Literal('YepBot');
export const Yeti = Schema.Literal('Yeti');
export const YioopBot = Schema.Literal('YioopBot');
export const yooSchemaBot = Schema.Literal('yooSchemaBot');
export const YoudaoBot = Schema.Literal('YoudaoBot');

/**
 * Union of all supported search engine bots for the robots.txt configuration.
 */
export const SearchEngines = Schema.Union(
	Spider360,
	HaoSouSpider,
	AdsBotGoogle,
	Googlebot,
	MediapartnersGoogle,
	adidxbot,
	bingbot,
	BingPreview,
	MicrosoftPreview,
	msnbot,
	Applebot,
	Baiduspider,
	coccoc,
	DuckDuckBot,
	facebook,
	gooblog,
	ichiro,
	Sogou,
	Yandex,
	AlgoliaCrawler,
	BublupBot,
	CCBot,
	Cliqzbot,
	Daumoa,
	DeuSu,
	EuripBot,
	Exploratodo,
	Feedly,
	Findxbot,
	istellabot,
	JikeSpider,
	Lycos,
	MailRu,
	MojeekBot,
	OrangeBot,
	Pinterest,
	Plukkie,
	Qwantify,
	Rambler,
	SemanticScholarBot,
	SeSchemanamBot,
	Sosospider,
	Slurp,
	Twitterbot,
	WhatsApp,
	yacybot,
	YepBot,
	Yeti,
	YioopBot,
	yooSchemaBot,
	YoudaoBot
);

/**
 * Utility Union Schema for allowing either a single string or an array of strings, used for the allow and disallow fields in the robots.txt policy configuration.
 */
export const StringArrayUnion = Schema.Union(Schema.String, Schema.Array(Schema.String));

/**
 * Union of all user agents that can be specified in the robots.txt policy configuration, including the wildcard "*" to apply to all user agents.
 */
export const UserAgentSchema = Schema.Union(Schema.Literal('*'), SearchEngines);

/**
 * Schema for defining the options for a robots.txt policy, including user agents, allowed and disallowed paths, crawl delay, and clean parameters.
 */
export const PolicyOptionsSchema = Schema.Struct({
	userAgent: Schema.optional(
		Schema.Union(UserAgentSchema, Schema.Array(UserAgentSchema))
	).annotations({
		description:
			'User Agent - Specify the user agent(s) that the policy applies to. This can be a single user agent, an array of user agents, or the wildcard "*" to apply to all user agents.',
	}),
	allow: Schema.optional(StringArrayUnion).annotations({
		description:
			'Allow - Specify the paths that are allowed for the specified user agents. This can be a single path or an array of paths.',
	}),
	disallow: Schema.optional(StringArrayUnion).annotations({
		description:
			'Disallow - Specify the paths that are disallowed for the specified user agents. This can be a single path or an array of paths.',
	}),
	crawlDelay: Schema.optional(Schema.Number).annotations({
		description:
			'Crawl Delay - Specify the crawl delay in seconds for the specified user agents. This tells search engine bots how many seconds to wait between requests to the server.',
	}),
	cleanParam: Schema.optional(StringArrayUnion).annotations({
		description:
			'Clean Param - Specify URL parameters that should be ignored by search engine bots when crawling the site. This can help prevent duplicate content issues caused by URL parameters.',
	}),
}).annotations({
	title: 'Policy Options Schema',
	description:
		'Schema for defining the options for a robots.txt policy, including user agents, allowed and disallowed paths, crawl delay, and clean parameters.',
	identifier: 'PolicyOptions',
});

/**
 * Robots.txt configuration schema, which includes options for host, sitemap, and an array of policy options.
 */
export const RobotsTXTConfigSchema = Schema.Struct({
	host: Schema.optional(Schema.Union(Schema.String, Schema.Boolean)).annotations({
		description:
			'Host - Specify the preferred domain for the site. This can be a string (e.g., "www.example.com") or a boolean (true to use the current domain, false to omit the Host directive).',
	}),
	sitemap: Schema.optional(Schema.Union(StringArrayUnion, Schema.Boolean)).annotations({
		description:
			'Sitemap - Specify the URL(s) of the sitemap(s) for the site. This can be a single URL, an array of URLs, or a boolean (true to use the default sitemap location, false to omit the Sitemap directive).',
	}),
	policy: Schema.optional(Schema.Array(PolicyOptionsSchema)).annotations({
		description:
			'Policy - An array of policy objects that define the rules for different user agents. Each policy object can specify the user agents it applies to, allowed and disallowed paths, crawl delay, and clean parameters.',
	}),
}).annotations({
	title: 'Robots.txt Configuration Schema',
	description:
		'Schema for configuring the robots.txt file, including host, sitemap, and policy options.',
	identifier: 'RobotsTXTConfig',
});

/**
 * Type for the Robots TXT Search Engine Bots, which includes all supported search engine bots for the robots.txt configuration.
 */
export type SearchEngine = typeof SearchEngines.Type;

/**
 * Type for the User Agent, which can be either a specific search engine bot or the wildcard "*" to apply to all user agents.
 */
export type UserAgent = typeof UserAgentSchema.Type;

/**
 * Type for the policy options, which includes user agents, allowed and disallowed paths, crawl delay, and clean parameters for the robots.txt configuration.
 */
export type PolicyOptions = typeof PolicyOptionsSchema.Type;

/**
 * Type for the robots.txt configuration, which includes options for host, sitemap, and an array of policy options.
 */
export type RobotsConfig = typeof RobotsTXTConfigSchema.Type;

/**
 * Resolved type for the robots.txt configuration, where all optional fields have been resolved to their default values if not provided.
 */
export type RobotsConfigResolved = typeof RobotsTXTConfigSchema.Encoded;
