// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';

import { remarkStripFirstImage } from './src/remark-plugins/remark-strip-first-image.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://nitza.dev',
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkStripFirstImage],
    }),
  },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['condo-elegant-shipped-degree.trycloudflare.com'],
    },
  },
});