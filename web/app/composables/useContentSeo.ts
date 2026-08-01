/**
 * Generates canonical + hreflang + og head tags for content pages.
 * Mirrors the nuxt2 head() logic from pages/_slug.vue and about/_slug.vue.
 */
export function useContentSeo(options: {
  path: string; // canonical path segment e.g. '' or '/about/overview' or '/faq'
  locale: Ref<string> | ComputedRef<string>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | null;
}) {
  const config = useRuntimeConfig();
  const { locale } = options;

  const siteUrl = config.public.siteUrl as string;
  const siteLocales = config.public.locales as string[];

  const localePathSegment = computed(() =>
    locale.value === 'en' ? '' : `/${locale.value}`,
  );

  const canonicalHref = computed(() =>
    `${siteUrl}${localePathSegment.value}${options.path}`,
  );

  // unhead v3 discriminates its link union on a literal `rel`, so these have to
  // be `as const` — a widened `string` matches no member and fails to type-check.
  const hreflangLinks = computed(() =>
    [
      ...siteLocales.map((loc: string) => {
        const seg = loc === 'en' ? '' : `/${loc}`;
        return { rel: 'alternate' as const, hreflang: loc, href: `${siteUrl}${seg}${options.path}` };
      }),
      { rel: 'alternate' as const, hreflang: 'x-default', href: `${siteUrl}${options.path}` },
    ],
  );

  // unhead v3's meta union discriminates on which of name/property/http-equiv/charset
  // is present, so a bare `Record<string, string>` matches no member.
  const headMeta: ({ name: string; content: string } | { property: string; content: string })[] = [];
  if (options.noIndex) {
    headMeta.push({ name: 'robots', content: 'noindex' });
  }
  if (options.seoDescription) {
    headMeta.push({ name: 'description', content: options.seoDescription });
  }
  if (options.ogTitle) {
    headMeta.push({ property: 'og:title', content: options.ogTitle });
  }
  if (options.ogDescription) {
    headMeta.push({ property: 'og:description', content: options.ogDescription });
  }
  headMeta.push({ property: 'og:image', content: `${siteUrl}/share.jpg` });

  const scripts = options.structuredData
    ? [{ type: 'application/ld+json' as const, innerHTML: JSON.stringify(options.structuredData) }]
    : [];

  useHead(() => ({
    title: options.seoTitle ?? undefined,
    link: [
      { rel: 'canonical', href: canonicalHref.value },
      ...hreflangLinks.value,
    ],
    meta: headMeta,
    script: scripts,
  }));
}
