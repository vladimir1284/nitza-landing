---
description: Write the final es/en portfolio content files from the approved drafts + optimized images, and validate the build
argument-hint: <slug>
allowed-tools: Read, Write, Bash(ls:*), Bash(npm run build:*), Bash(npm run astro:*), AskUserQuestion
---

Stage 4 of 4 of the portfolio registration pipeline. `$ARGUMENTS` is the slug.

## 1. Preconditions

Check all of these exist; if any is missing, tell the user which stage to (re)run and stop:

- `content-staging/portfolio/<slug>/draft.md` (from `/portfolio-new`)
- `content-staging/portfolio/<slug>/draft-en.md` (from `/portfolio-translate`)
- `src/assets/images/portfolio/<slug>/cover.webp` (from `/portfolio-images`) — unless the user explicitly confirmed a gallery-less project in stage 1, in which case skip the image requirement.

## 2. Build the gallery list

`ls src/assets/images/portfolio/<slug>/`, sort so `cover.webp` is first followed by `2.webp`, `3.webp`, ... in numeric order. Each becomes a relative import path from the content file's location: `../../assets/images/portfolio/<slug>/<filename>`.

## 3. Write the Spanish entry

`src/content/portfolio/<slug>.md` — take `title`/`shortDescription`/`stack`/`pubDate`/`featured` and the body from `draft.md` (drop the staging-only `cover` field):

```markdown
---
title: "<title>"
shortDescription: "<shortDescription>"
lang: "es"
pubDate: <pubDate>
stack: [<stack>]
gallery:
  - ../../assets/images/portfolio/<slug>/cover.webp
  - ../../assets/images/portfolio/<slug>/2.webp
  ...
featured: <featured>
---

<body from draft.md>
```

## 4. Write the English entry

`src/content/portfolio/<slug>-en.md` — same shape, `lang: "en"`, title/shortDescription/body from `draft-en.md`, same `stack`/`pubDate`/`featured`/`gallery` as the Spanish file (this mirrors the existing blog pairing convention: `<slug>.md` + `<slug>-en.md`, matched purely by filename, consumed as-is by the already-built `src/pages/portfolio/[...slug].astro` and `src/pages/en/portfolio/[...slug].astro` routes).

## 5. Validate

Run `npm run build`. This type-checks the content collection schema (including that every `gallery` path actually resolves to a real image) and renders every page. If it fails, read the error, fix the two new markdown files (not the schema/components — those are already correct), and re-run until it passes.

## 6. Wrap up

Report success and the URLs the project will be live at (`/portfolio/<slug>` and `/en/portfolio/<slug>`). Ask the user (don't just do it) whether to delete `content-staging/portfolio/<slug>/` now that it's published — the raw photos and drafts are no longer needed once the optimized webp files are committed, but deleting is their call.
