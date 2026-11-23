import { getCollection, type CollectionEntry } from 'astro:content';

/** Prefix a path with the site's base (needed if you deploy under /repo-name). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export function readingTime(body = ''): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * All published posts, newest first.
 * Posts dated in the future stay hidden until a build runs on or after that date
 * (the deploy workflow rebuilds every Monday). `npm run dev` shows them so you can preview.
 */
export async function getPosts(): Promise<CollectionEntry<'blog'>[]> {
  const now = Date.now();
  const posts = await getCollection(
    'blog',
    ({ data }) => !data.draft && (import.meta.env.DEV || data.date.valueOf() <= now),
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
