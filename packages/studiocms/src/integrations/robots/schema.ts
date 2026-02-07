import { z } from 'astro/zod';

/**
 * A Zod schema representing a union of known search engine user agent identifiers.
 *
 * This schema is used to validate or restrict values to a predefined set of search engine bot names,
 * such as 'Googlebot', 'bingbot', 'Yandex', and others. It is useful for scenarios where you need to
 * identify or whitelist/blacklist specific search engine crawlers by their user agent strings.
 *
 * @example
 * SearchEngines.parse('Googlebot'); // passes
 * SearchEngines.parse('UnknownBot'); // throws ZodError
 */
const SearchEngines = z.union([
	z.literal('360Spider'),
	z.literal('360Spider-Image'),
	z.literal('360Spider-Video'),
	z.literal('HaoSouSpider'),
	z.literal('AdsBot-Google'),
	z.literal('AdsBot-Google-Mobile'),
	z.literal('AdsBot-Google-Mobile-Apps'),
	z.literal('Googlebot'),
	z.literal('Googlebot-Image'),
	z.literal('Googlebot-Mobile'),
	z.literal('Googlebot-News'),
	z.literal('Googlebot-Video'),
	z.literal('Mediapartners-Google'),
	z.literal('adidxbot'),
	z.literal('bingbot'),
	z.literal('BingPreview'),
	z.literal('MicrosoftPreview'),
	z.literal('msnbot'),
	z.literal('msnbot-media'),
	z.literal('Applebot'),
	z.literal('AppleNewsBot'),
	z.literal('Baiduspider'),
	z.literal('Baiduspider-image'),
	z.literal('Baiduspider-mobile'),
	z.literal('Baiduspider-news'),
	z.literal('Baiduspider-video'),
	z.literal('coccoc'),
	z.literal('coccocbot-image'),
	z.literal('coccocbot-web'),
	z.literal('DuckDuckBot'),
	z.literal('DuckDuckGo-Favicons-Bot'),
	z.literal('facebookcatalog'),
	z.literal('facebookexternalhit'),
	z.literal('Facebot'),
	z.literal('gooblog'),
	z.literal('ichiro'),
	z.literal('Sogou blog'),
	z.literal('Sogou inst spider'),
	z.literal('Sogou News Spider'),
	z.literal('Sogou Orion spider'),
	z.literal('Sogou spider2'),
	z.literal('Sogou web spider'),
	z.literal('Yandex'),
	z.literal('YandexMobileBot'),
	z.literal('Algolia Crawler'),
	z.literal('BublupBot'),
	z.literal('CCBot'),
	z.literal('Cliqzbot'),
	z.literal('Daumoa'),
	z.literal('DeuSu'),
	z.literal('EuripBot'),
	z.literal('Exploratodo'),
	z.literal('Feedly'),
	z.literal('Findxbot'),
	z.literal('istellabot'),
	z.literal('JikeSpider'),
	z.literal('Lycos'),
	z.literal('Mail.Ru'),
	z.literal('MojeekBot'),
	z.literal('OrangeBot'),
	z.literal('Pinterest'),
	z.literal('Plukkie'),
	z.literal('Qwantify'),
	z.literal('Rambler'),
	z.literal('SemanticScholarBot'),
	z.literal('SeznamBot'),
	z.literal('Sosospider'),
	z.literal('Slurp'),
	z.literal('Twitterbot'),
	z.literal('WhatsApp'),
	z.literal('yacybot'),
	z.literal('YepBot'),
	z.literal('Yeti'),
	z.literal('YioopBot'),
	z.literal('yoozBot'),
	z.literal('YoudaoBot'),
]);

/**
 * A Zod schema that validates either a single string or an array of strings.
 *
 * This union schema is useful for cases where a value can be provided as a single string
 * or as a list of strings, allowing for flexible input validation.
 *
 * @example
 * StringArrayUnion.parse("hello"); // passes
 * StringArrayUnion.parse(["hello", "world"]); // passes
 * StringArrayUnion.parse(42); // fails
 */
const StringArrayUnion = z.union([z.string(), z.array(z.string())]);

/**
 * A Zod schema that validates a value as either a string array (as defined by `StringArrayUnion`)
 * or a boolean. This allows for flexible input types where the value can be an array of strings
 * or a boolean value (`true` or `false`).
 */
const StringArrayBooleanUnion = z.union([StringArrayUnion, z.boolean()]);

/**
 * A Zod schema that validates a value as either a string or a boolean.
 *
 * This union schema can be used to accept values that are of type `string` or `boolean`.
 *
 * @example
 * StringBooleanUnion.parse("hello"); // passes
 * StringBooleanUnion.parse(true);    // passes
 * StringBooleanUnion.parse(42);      // fails
 */
const StringBooleanUnion = z.union([z.string(), z.boolean()]);

/**
 * Schema for validating user agent strings in robots.txt rules.
 *
 * Accepts either the wildcard '*' (representing all user agents) or a value from the `SearchEngines` schema.
 *
 * @see {@link SearchEngines} for the list of supported search engine user agents.
 */
export const UserAgentSchema = z.union([z.literal('*'), SearchEngines]);

export const PolicyOptionsSchema = z.object({
	/**
	 * @description
	 * [ Required ] Indicates the robot to which the rules listed in `robots.txt` apply.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: [
	 *      'Googlebot',
	 *      'Applebot',
	 *      'Baiduspider',
	 *      'bingbot'
	 *    ],
	 *    // crawling rule(s) for above bots
	 *  }
	 * ]
	 * ```
	 * Verified bots, refer to [DITIG](https://www.ditig.com/robots-txt-template#regular-template) or [Cloudflare Radar](https://radar.cloudflare.com/traffic/verified-bots).
	 */
	userAgent: z.union([UserAgentSchema, z.array(UserAgentSchema)]).optional(),
	/**
	 * @description
	 * [ At least one or more `allow` or `disallow` entries per rule ] Allows indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[{allow:["/"]}]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	allow: StringArrayUnion.optional(),
	/**
	 * @description
	 * [ At least one or more `disallow` or `allow` entries per rule ] Prohibits indexing site sections or individual pages.
	 * @example
	 * ```ts
	 * policy:[
	 *  {
	 *    disallow:[
	 *      "/admin",
	 *      "/uploads/1989-08-21/*.jpg$"
	 *    ]
	 *  }
	 * ]
	 * ```
	 * Path-based URL matching, refer to [SYNTAX](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#url-matching-based-on-path-values) via Google.
	 */
	disallow: StringArrayUnion.optional(),
	/**
	 * @description
	 * [ Optional ] Specifies the minimum interval (in seconds) for the search robot to wait after loading one page, before starting to load another.
	 *
	 * @example
	 * ```ts
	 * policy:[{crawlDelay:5}]
	 * ```
	 * About the [Crawl-delay](https://yandex.com/support/webmaster/robot-workings/crawl-delay.html#crawl-delay) directive.
	 */
	crawlDelay: z.number().optional(),
	/**
	 * @description
	 * [ Optional ] Indicates to the robot that the page URL contains parameters (like UTM tags) that should be ignored when indexing it.
	 *
	 * @example
	 * ```bash
	 * # for URLs like:
	 * www.example2.com/index.php?page=1&sid=2564126ebdec301c607e5df
	 * www.example2.com/index.php?page=1&sid=974017dcd170d6c4a5d76ae
	 * ```
	 * ```ts
	 * policy:[
	 *  {
	 *    cleanParam: [
	 *      "sid /index.php",
	 *    ]
	 *  }
	 * ]
	 * ```
	 * For additional examples, please consult
	 * Yandex's [SYNTAX](https://yandex.com/support/webmaster/robot-workings/clean-param.html#clean-param__additional) guide.
	 */
	cleanParam: StringArrayUnion.optional(),
});

export const RobotsTXTConfigSchema = z.object({
	/**
	 * @default false
	 * @description
	 * [ Optional ] Some crawlers(Yandex) support and only accept domain names.
	 * @example
	 * ```ts
	 * integrations:[
	 *  robots({
	 *    host: siteUrl.replace(/^https?:\/\/|:\d+/g, "")
	 *  })
	 * ]
	 * ```
	 */
	host: StringBooleanUnion.optional(),
	/**
	 * @description
	 * [ Optional, zero or more per file ] The location of a sitemap for this website.
	 * @example
	 * ```ts
	 * sitemap: [
	 *  "https://example.com/sitemap.xml",
	 *  "https://www.example.com/sitemap.xml"
	 * ]
	 * ```
	 * The value of the [SITEMAP](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#sitemap) field is case-sensitive.
	 */
	sitemap: StringArrayBooleanUnion.optional(),
	/**
	 * @description
	 * [ Optional ] List of `policy` rules.
	 * @default
	 * ```ts
	 * policy:[
	 *  {
	 *    userAgent: "*",
	 *    allow: "/"
	 *  }
	 * ]
	 * ```
	 * For more help, refer to [SYNTAX](https://yandex.com/support/webmaster/controlling-robot/robots-txt.html#recommend) by Yandex.
	 */
	policy: z.array(PolicyOptionsSchema).optional(),
});

export type SearchEngine = z.infer<typeof SearchEngines>;
export type UserAgent = z.infer<typeof UserAgentSchema>;
export type PolicyOptions = z.infer<typeof PolicyOptionsSchema>;
export type RobotsConfig = z.infer<typeof RobotsTXTConfigSchema>;
