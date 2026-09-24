import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

let base = '/';

export default defineConfig({
  optimizeDeps: { exclude: ['three'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  plugins: [{
    name: 'dfp-offline',
    configResolved(config) { base = config.base; },
    writeBundle(options) {
      const root = resolve(options.dir || 'dist');
      const files = [];
      function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) { const path = resolve(dir, entry.name); if (entry.isDirectory()) walk(path); else if (entry.name !== 'sw.js') files.push(path); } }
      walk(root);
      const hash = createHash('sha256'); files.sort().forEach(path => hash.update(readFileSync(path))); hash.update(base); hash.update(process.env.DFP_BUILD_ID || 'release');
      const revision = hash.digest('hex').slice(0, 16), urls = files.map(path => base + relative(root, path).replaceAll('\\', '/'));
      const worker = `// DFP build ${revision}: all runtime assets are installed before activation.
const CACHE = 'dfp-assets-${revision}';
const FILES = ${JSON.stringify(urls)};
const BASE = ${JSON.stringify(base)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  // Preserve older caches for existing tabs. Saves are deliberately untouched.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === 'navigate') return (await cache.match(BASE + 'index.html')) || fetch(event.request);
    // Same-origin immutable assets are identical across Vite's Origin variation.
    const current = await cache.match(event.request, { ignoreSearch: true, ignoreVary: true });
    if (current) return current;
    const older = await caches.match(event.request, { ignoreVary: true });
    if (older) return older;
    return fetch(event.request);
  })());
});
`;
      writeFileSync(resolve(root, 'sw.js'), worker);
    },
  }],
});
