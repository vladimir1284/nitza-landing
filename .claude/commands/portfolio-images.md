---
description: Optimize a portfolio project's staged photos into src/assets/images/portfolio/<slug>/
argument-hint: <slug>
allowed-tools: Read, Bash(node scripts/optimize-portfolio-images.mjs:*), Bash(ls:*), Bash(npm run portfolio:images:*)
---

Stage 3 of 4 of the portfolio registration pipeline. `$ARGUMENTS` is the slug.

## 1. Determine the cover image

Read `content-staging/portfolio/<slug>/draft.md` frontmatter for the `cover` field (set in `/portfolio-new`). If `draft.md` doesn't exist, ask the user which staged file should be the cover, or default to the alphabetically-first image.

## 2. Run the optimizer

```
node scripts/optimize-portfolio-images.mjs <slug> --cover "<cover filename>"
```

This reads every image in `content-staging/portfolio/<slug>/`, resizes to fit within 1600px (no upscaling), converts to webp (quality 82), and writes them to `src/assets/images/portfolio/<slug>/` as `cover.webp`, `2.webp`, `3.webp`, ... in that order.

## 3. Verify

`ls src/assets/images/portfolio/<slug>/` and confirm `cover.webp` plus the expected count of numbered files are present. Report the file list and total output size to the user.

## 4. Next step

Tell the user the next step is `/portfolio-publish <slug>` (needs `draft.md` and `draft-en.md` from the previous stages, plus these optimized images).
