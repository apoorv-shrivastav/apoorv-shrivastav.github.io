// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// If you deploy to a repo named `apoorv-shrivastav.github.io`, keep `base` as '/'.
// If you deploy to a repo with another name (e.g. `website`), set base: '/website'.
export default defineConfig({
  site: 'https://apoorv-shrivastav.github.io',
  base: '/',
  integrations: [sitemap()],
});
