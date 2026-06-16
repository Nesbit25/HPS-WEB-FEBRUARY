const { join } = require('path');

/**
 * Install Chromium into a project-local cache so Vercel's build container can
 * find it during `npm run build:prerender`. Without this, Puppeteer downloads
 * Chromium to the home dir, which Vercel does not always preserve between the
 * install and build steps.
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
