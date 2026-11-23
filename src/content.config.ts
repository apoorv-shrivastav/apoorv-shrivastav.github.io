import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    // Which side of the site this post shows up on.
    mode: z.enum(['professional', 'personal']),
    // Adds a ✦ next to the title in lists.
    featured: z.boolean().default(false),
    // Drafts are hidden from the site entirely.
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
