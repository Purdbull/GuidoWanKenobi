// Astro-Konfiguration für mancusi.at
// SITE und BASE_PATH setzt der GitHub-Workflow. Solange die Domain noch nicht umgestellt ist,
// läuft die Seite unter https://<konto>.github.io/<repo>/, danach unter https://mancusi.at/.
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://mancusi.at',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
});
