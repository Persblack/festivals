import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  site: 'https://synners.si',
  // Hostinger 301s /map to /map/; canonical and internal links use the slash form.
  trailingSlash: 'always',
});
