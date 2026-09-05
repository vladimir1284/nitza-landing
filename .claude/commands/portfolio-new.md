---
description: Intake a new portfolio project — read staged photos/notes, ask clarifying questions, draft the Spanish copy
argument-hint: <slug> [notas cortas]
allowed-tools: Read, Write, Bash, Glob, AskUserQuestion
---

You are running stage 1 of 4 of the portfolio registration pipeline (`/portfolio-new` → `/portfolio-translate` → `/portfolio-images` → `/portfolio-publish`).

Slug: the first word of `$ARGUMENTS`. Everything after it is optional free-form notes from the user about the project.

## 1. Read the staging folder

Staging dir: `content-staging/portfolio/<slug>/`.

- If it doesn't exist, tell the user to create it and drop the raw project photos in it (any format/size, no pre-processing needed), plus optionally a `notes.md` with rough bullet points. Stop here.
- List the image files in it (`ls`). If there are 0 images, warn but continue — a project can be published without a gallery if the user confirms.
- If `content-staging/portfolio/<slug>/notes.md` exists, read it.
- If `content-staging/portfolio/<slug>/draft.md` already exists, this slug was already drafted. Show the user the existing draft and ask (AskUserQuestion) whether to overwrite it or stop — don't silently clobber prior work.

## 2. Ask clarifying questions

Do not draft copy from thin material. Use AskUserQuestion (or plain chat if AskUserQuestion doesn't fit the shape) to pin down whatever isn't already answered by the notes/`$ARGUMENTS`:

1. **Título** del proyecto (nombre corto, no el nombre del cliente si es confidencial).
2. **Stack** — lista de tecnologías (para el frontmatter `stack`, ej. `["Astro", "Cloudflare Workers"]`).
3. **Cliente/industria** — ¿se puede nombrar al cliente y su industria, o va enmascarado (ej. "Cliente confidencial · Logística")? Mirar `src/i18n/ui.ts` testimonials para el tono de enmascarado ya usado en el sitio si aplica.
4. **El reto** — qué problema tenía el cliente antes.
5. **La solución** — qué se construyó, decisiones técnicas relevantes.
6. **El resultado** — impacto medible o cualitativo (evitar cifras inventadas — si no hay dato duro, decirlo en términos cualitativos).
7. **¿Cuál fotos es portada?** (nombre de archivo entre las listadas) — si no importa, elegí la primera alfabéticamente.
8. **¿Featured?** (aparece en la home, sección Portfolio de 3 destacados) — sí/no.
9. **Fecha** de publicación (`pubDate`) — si no la dan, usar hoy.

Push back if an answer is too generic to write a real paragraph from ("un proyecto de software" no alcanza) — ask a follow-up instead of inventing detail.

## 3. Draft the Spanish copy — uniform structure, every project must follow this exact shape

`shortDescription`: one sentence, ~120–160 characters, card-teaser tone (see `PortfolioCard.astro` / home `Portfolio.astro` — this is what shows on the grid card, no fluff, concrete outcome or scope).

Body markdown (this becomes the `<Content />` rendered inside `PortfolioPost.astro`'s `.prose-blog` styling — same voice family as the blog posts in `src/content/blog/`, but shorter, case-study register, not essay register):

```markdown
<intro paragraph — 2-3 sentences, sets the scene: who the client is (or masked description), what they needed>

## El reto

<1 paragraph>

## La solución

<1-2 paragraphs>

## El resultado

<1 paragraph>
```

Do not add extra top-level sections — keep every project to this exact skeleton so the portfolio reads uniformly. Do not embed an image at the top of the body (the cover image is rendered separately by `PortfolioPost.astro`, not inline — unlike blog posts which rely on `remarkStripFirstImage`).

Reuse the existing brand-name styling convention: when "Nitza Develop" appears in the title, leave it as plain text in the draft — the `.replace(...)` + `set:html` treatment is applied at render time by the components, not by you.

## 4. Review loop

Show the user the full draft (title, shortDescription, stack, masking decision, body) in chat. Ask if it needs edits. Iterate until approved — do not write anything to disk until they say it's good.

## 5. Save the approved draft

Write `content-staging/portfolio/<slug>/draft.md`:

```markdown
---
title: "<título>"
shortDescription: "<one-liner>"
stack: [<lista>]
pubDate: <YYYY-MM-DD>
featured: <true|false>
cover: "<filename elegido como portada>"
---

<body markdown as drafted above>
```

(`cover` here is a temporary staging-only field so `/portfolio-images` knows which file becomes `cover.webp` — it is NOT part of the final content-collection schema and won't be copied into `src/content/portfolio/`.)

Tell the user the next step is `/portfolio-translate <slug>`.
