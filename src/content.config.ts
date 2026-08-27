import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      lang: z.enum(["es", "en"]).default("es"),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.string().url().optional(),
      category: z.string(),
      categorySlug: z.string(),
      readingTime: z.number().optional(),
    }),
});

export const collections = { blog };
