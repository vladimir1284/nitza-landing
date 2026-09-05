---
description: Translate an approved portfolio draft to English, matching the site's faithful-translation convention
argument-hint: <slug>
allowed-tools: Read, Write, AskUserQuestion
---

Stage 2 of 4 of the portfolio registration pipeline. `$ARGUMENTS` is the slug.

## 1. Load the approved draft

Read `content-staging/portfolio/<slug>/draft.md`. If it doesn't exist, tell the user to run `/portfolio-new <slug>` first and stop.

## 2. Translate

Follow the same convention already used for blog posts in this repo (see any pair in `src/content/blog/`, e.g. `commission-engine.md` / `commission-engine-en.md`): a **faithful, section-by-section translation** — same heading structure, same order, same paragraph count and argument structure. This is not an independent English rewrite; it's the same case study in English.

Translate:
- `title`
- `shortDescription`
- The body (intro paragraph + `## El reto` → `## The Challenge`, `## La solución` → `## The Solution`, `## El resultado` → `## The Result`)

Keep untranslated: `stack` (technology names), `pubDate`, `featured`, `cover` (filename).

## 3. Review loop

Show the full English draft to the user. Ask if it needs edits (wording, terminology, anything that reads awkward in English). Iterate until approved.

## 4. Save

Write `content-staging/portfolio/<slug>/draft-en.md`:

```markdown
---
title: "<translated title>"
shortDescription: "<translated one-liner>"
stack: [<same list as draft.md>]
pubDate: <same as draft.md>
featured: <same as draft.md>
cover: "<same filename as draft.md>"
---

<translated body, same 4-block structure: intro / ## The Challenge / ## The Solution / ## The Result>
```

Tell the user the next step is `/portfolio-images <slug>` (or `/portfolio-publish <slug>` directly if images were already optimized in a prior run).
