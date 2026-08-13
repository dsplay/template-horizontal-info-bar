/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import pkg from './package.json' with { type: 'json' };
import templateManifest from '@dsplay/template-manifest/vite-plugin';

export default defineConfig({
  base: './',
  plugins: [
    // rss-parser extends Node's EventEmitter (via events/stream/timers) - Vite only
    // externalizes those to browser-incompatible stubs by default, crashing at
    // `new Parser()`. This aliases them to real browser-compatible shims instead.
    nodePolyfills({
      include: ['events', 'stream', 'timers'],
    }),
    react(),
    legacy({
      targets: pkg.browserslist,
    }),
    templateManifest(),
  ],
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
        silenceDeprecations: ['import'],
      },
    },
  },
  build: {
    outDir: 'build',
    // oxc's minifier ignores the legacy chunk's target and reintroduces ?./?? after Babel expands them; terser doesn't.
    minify: 'terser',
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup-tests.js'],
  },
});
