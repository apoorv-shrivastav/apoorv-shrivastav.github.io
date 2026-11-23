# apoorv-site

A personal site with a **Professional / Personal** switch, built with [Astro](https://astro.build).

- One page holds both sides; the toggle shows one at a time. Each side has its own bio, photo, post list, colours and font.
- Links are shareable: `/?mode=professional` or `/?mode=personal`. The site also remembers the visitor's last choice.
- Posts are Markdown files with a `mode:` field.
- Has RSS, a sitemap, dark mode, and works on phones.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## Where to edit

| What | File |
|---|---|
| Name, bios, taglines, links | `src/config.ts` |
| Photos | `public/images/` (then update the paths in `src/config.ts`) |
| Projects | `src/data/projects.ts` |
| Posts | `src/content/blog/*.md` (copy `_template.md`) |
| Colours and fonts per mode | top of `src/styles/global.css` |

### Writing a post

Create `src/content/blog/my-post.md`. The URL becomes `/blog/my-post/`.

```md
---
title: "My post"
description: "One line for link previews."
date: 2026-12-01
mode: personal      # or professional
featured: false     # true adds a ✦
draft: false        # true hides it
---

Write in Markdown.
```

## Put it online (GitHub Pages, free)

1. Create a GitHub repo named **`apoorv-shrivastav.github.io`** and push this folder to `main`.
2. In the repo, go to **Settings → Pages → Source** and pick **GitHub Actions**.
3. Each push to `main` now deploys to https://apoorv-shrivastav.github.io.

If you name the repo something else (say `website`), set `base: '/website'` in `astro.config.mjs`.

**Custom domain:** buy one, add it under Settings → Pages, put the domain in a `public/CNAME` file, and change `site` in `astro.config.mjs`.

Vercel, Netlify and Cloudflare Pages also work: import the repo and they detect Astro automatically.
