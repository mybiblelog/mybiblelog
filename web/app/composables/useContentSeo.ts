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

  const hreflangLinks = computed(() =>
    [
      ...siteLocales.map((loc: string) => {
        const seg = loc === 'en' ? '' : `/${loc}`;
        return { rel: 'alternate', hreflang: loc, href: `${siteUrl}${seg}${options.path}` };
      }),
      { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}${options.path}` },
    ],
  );

  const headMeta: Record<string, string>[] = [];
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
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(options.structuredData) }]
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
