import { defineContentConfig, defineCollection, z } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        seo: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
        }).optional(),
        og: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
        }).optional(),
        ld_json: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
        }).optional(),
      }),
    }),
  },
});
