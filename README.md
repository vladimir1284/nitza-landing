# Nitza Develop — Haute Cuisine Software Development

Landing page for Nitza Develop, built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) v4, and pnpm. Bilingual (es/en), light/dark theme, static output ready for Cloudflare Pages.

## Stack

- **Astro 7** — static output, no server adapter needed.
- **Tailwind CSS 4** — via `@tailwindcss/vite`, CSS-first `@theme` config in `src/styles/global.css`.
- **i18n** — Astro's built-in routing. Spanish at `/`, English at `/en/`. Dictionaries in `src/i18n/ui.ts`.
- **Theme** — `.dark` class on `<html>`, toggled client-side, persisted in `localStorage`, no flash on load.
- **Images** — local assets under `src/assets/images/`, optimized at build time via `astro:assets` + `sharp` (requires `sharp` as a dependency).

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

## Deploying to Cloudflare

Static output (`dist/`), no adapter required. Simplest path: Cloudflare Pages dashboard → connect this repo → build command `pnpm build` → output directory `dist`.

## Known follow-ups

- `astro.config.mjs` has a placeholder `site: 'https://example.com'` — update once the production domain is set (used for canonical/hreflang tags).
- Team member headshots still point at ephemeral mockup URLs (`lh3.googleusercontent.com/aida...`) — swap for real photos or avatar treatment.
- Dark-mode color values were inferred from the light Material-3-style palette in the original mockup (`reference-maqueta.html`), not specified in the source — worth a design review.
