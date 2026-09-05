# Nitza Develop — Haute Cuisine Software Development

Landing page for Nitza Develop, built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) v4, and pnpm. Bilingual (es/en), light/dark theme, static output ready for Cloudflare Pages.

## Stack

- **Astro 7** — static output, no server adapter needed.
- **Tailwind CSS 4** — via `@tailwindcss/vite`, CSS-first `@theme` config in `src/styles/global.css`.
- **i18n** — Astro's built-in routing. Spanish at `/`, English at `/en/`. Dictionaries in `src/i18n/ui.ts`.
- **Theme** — `.dark` class on `<html>`, toggled client-side, persisted in `localStorage`, no flash on load.
- **Images** — local assets under `src/assets/images/`, optimized at build time via `astro:assets` + `sharp` (requires `sharp` as a dependency). Portfolio galleries follow the same pattern (see [Portfolio pipeline](#portfolio-pipeline)).

## Project structure

```text
src/
├── assets/images/     # source images (optimized at build time)
├── components/        # Header, Hero, Team, Menu, Testimonials, Blog, Footer, theme/lang toggles
├── i18n/               # ui.ts (dictionaries), utils.ts (lang helpers)
├── layouts/Layout.astro
├── pages/
│   ├── index.astro     # Spanish (default locale)
│   └── en/index.astro  # English
└── styles/global.css   # design tokens, dark-mode overrides, ported typography scale
```

## Commands

| Command         | Action                                      |
| :--------------- | :------------------------------------------- |
| `pnpm install`   | Install dependencies                        |
| `pnpm dev`       | Start dev server at `localhost:4321`        |
| `pnpm build`     | Build static site to `./dist/`              |
| `pnpm preview`   | Preview the production build locally        |
| `pnpm astro check` | Type-check `.astro` files                |

## Portfolio pipeline

The `portfolio` content collection (`src/content.config.ts`) starts empty (`src/content/portfolio/.gitkeep`). New projects are registered through four Claude Code slash commands under `.claude/commands/`, run in order — each stage can be re-run independently if something needs fixing:

1. **`/portfolio-new <slug>`** — reads raw photos + optional notes from `content-staging/portfolio/<slug>/` (gitignored, create it yourself and drop files in), asks clarifying questions (title, stack, client masking, challenge/solution/result), and drafts the Spanish copy in a fixed structure (intro paragraph, `## El reto`, `## La solución`, `## El resultado`) so every project reads the same. Stops for your review before writing anything — saves the approved draft to `content-staging/portfolio/<slug>/draft.md`.
2. **`/portfolio-translate <slug>`** — translates the approved draft to English, section-by-section (same convention as the bilingual blog posts in `src/content/blog/`), saves to `content-staging/portfolio/<slug>/draft-en.md` after your review.
3. **`/portfolio-images <slug>`** — runs `scripts/optimize-portfolio-images.mjs` (also runnable directly, or via `npm run portfolio:images -- <slug>`) on the staged photos: resizes to fit within 1600px (no upscaling), converts to webp at quality 82, writes `src/assets/images/portfolio/<slug>/cover.webp`, `2.webp`, `3.webp`, ...
4. **`/portfolio-publish <slug>`** — writes `src/content/portfolio/<slug>.md` (es) and `<slug>-en.md` (en) from the two approved drafts, with `gallery` pointing at the optimized webp files (the `image()` schema helper resolves and further optimizes them at build time via `astro:assets`), then runs `npm run build` to validate. Asks before deleting the staging folder.

No external image host or API key is needed — everything lives in the repo and builds statically, which fits Cloudflare Pages' free plan (unlimited static asset bandwidth, no paid Image Resizing/Polish required).

## Deploying to Cloudflare

Static output (`dist/`), no adapter required. Simplest path: Cloudflare Pages dashboard → connect this repo → build command `pnpm build` → output directory `dist`.

## Known follow-ups

- `astro.config.mjs` has a placeholder `site: 'https://example.com'` — update once the production domain is set (used for canonical/hreflang tags).
- Team member headshots still point at ephemeral mockup URLs (`lh3.googleusercontent.com/aida...`) — swap for real photos or avatar treatment.
- Dark-mode color values were inferred from the light Material-3-style palette in the original mockup (`reference-maqueta.html`), not specified in the source — worth a design review.
