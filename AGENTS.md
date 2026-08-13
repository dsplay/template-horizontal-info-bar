# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## What this project is

The DSPLAY **Horizontal Information Bar** template — a [React](https://reactjs.org/) app built with [Vite](https://vitejs.dev/) that shows up to five configurable widgets (clock, weather, currency quotes, RSS news, sponsor logo) laid out horizontally. Requires Node.js 22.22.2+, 24.15.0+, or 26+ (see `.nvmrc`). See README.md for the template's variables.

## Directory structure

```
index.html                 <-- Vite entry point
vite.config.js             <-- includes @dsplay/template-manifest's Vite plugin (see below)
public/
  dsplay-data.js            <-- mock DSPLAY data for local development
src/
  index.jsx                 <-- React entry point
  style.sass                 <-- global layout (html/body/#root, shared .block utility class)
  setup-tests.js             <-- Vitest setup (referenced by vite.config.js)
  utils/
    logger.js                 <-- dev-only console logger (no-ops in production builds)
  components/
    app/                      <-- top-level component: reads widgets_sequence_query, composes the widgets
    clock/                    <-- local time
    weather/                  <-- current weather for the configured lat/lon, via DSPLAY's own weather API
    quotes/                   <-- currency conversion between two source currencies and a target currency
    news/                     <-- one random headline from an RSS feed, refreshed periodically
    sponsor/                  <-- a single logo image
build.sh                    <-- zips the Vite build output into template.zip
```

## File and folder naming

- **kebab-case everywhere** in `src/` (and anywhere else in this repo we author ourselves) — folders, JS/JSX files, Sass files, test files. Doesn't apply to files whose name is a fixed convention from tooling (`package.json`, `vite.config.js`, etc.) or to vendored/third-party assets we don't control the naming of.
- **Every component gets its own folder with an `index.jsx`.** For a simple component, `index.jsx` *is* the component. For one that grows into several files, `index.jsx` becomes a barrel re-exporting the folder's public API.
- **Always import a component by its folder, never by reaching into `index`** — `import Weather from '../weather'`, never `.../weather/index`.
- Non-component helpers (e.g. `src/utils/logger.js`) live outside `components/` and don't need the folder+`index.jsx` treatment — plain kebab-case files are fine.
- Enforced automatically by ESLint's `unicorn/filename-case` rule for the naming half of this; the folder+`index.jsx`+import-by-folder structure is not machine-checked, just convention.

## Package identity

`package.json`'s `"name"` must identify this template, not the boilerplate it was cloned from — see `template-boilerplate-react`'s AGENTS.md for the full convention. This template's is `dsplay-template-horizontal-info-bar` (previously `@dsplay/template-horizontal-bar`, which didn't even match the repo's own name).

## README structure

Every DSPLAY template's `README.md` follows the same skeleton (see `template-boilerplate-react`'s AGENTS.md for the full reference copy):

1. Logo badge + `# DSPLAY - <Name>` + a one/two-sentence description.
2. *(optional, only if the template has more than one visual arrangement)* **Features**.
3. *(optional, only if appearance changes meaningfully by screen format)* **Supported screen formats**.
4. **Template variables** — a `Key | Type | Default | Description` table, ending with the "register as Template Vars in the DSPLAY CMS" reminder.
5. **Local development**, 6. *(optional)* **For developers**, 7. **Test assets** / **Packing (release build)** / **Maintaining dependencies** (-> AGENTS.md) / **More**.

Skip a numbered section entirely rather than including it empty.

## Internationalization (i18n)

This template renders no static, developer-authored UI text at all — every widget only renders data it fetched or a template variable's own value (time, temperature, currency codes/amounts, a feed headline, an image). There is nothing to route through `react-i18next`, so this template has no `i18n.js` and no `react-i18next` dependency, unlike the other React templates in this ecosystem. If a future change adds any static label, wire up i18n then — see `template-boilerplate-react`'s AGENTS.md for the full convention (key = English text, `en`/`pt`/`es`/`it`/`de`/`nl` minimum, etc.).

## Runtime model

- `public/dsplay-data.js` defines `dsplay_config`/`dsplay_media`/`dsplay_template` mock globals used only in **development**. `build.sh` blanks its content in the production build — the DSPLAY Android app injects the real `window.DSPLAY.getData()` before any script runs.
- This template reads `dsplay_template` values via `@dsplay/template-utils`'s `tval`/`tbval` directly (not `@dsplay/react-template-utils`'s hooks, unlike the other migrated templates) — most values are read once at module load time as plain constants rather than inside a component, which is safe here because DSPLAY injects its data before any module executes. This predates the 2026 migration and was left as-is; only the build tooling, file structure, and dead code were touched.
- Each widget independently fetches its own data (weather via DSPLAY's own API, currency quotes via a free public API, RSS via a CORS proxy) and caches the result in `localStorage` with its own TTL/version key, refreshing on its own interval. `src/utils/logger.js` gates the diagnostic `console.log`/`console.error` calls so they're silent in production builds but still visible when debugging a dev build via remote WebView inspection.
- Each widget is independently optional — `src/components/app/index.jsx` only renders the ones whose required variable(s) are set (e.g. `Weather` renders nothing without both `latitude`/`longitude`).

## Template variable manifest

`vite.config.js` registers `@dsplay/template-manifest`'s Vite plugin, which on every build statically scans `src/` for `tval`/`useTemplateVal`-style reads and captures `public/dsplay-data.js` as example data, writing `template-variables.json` + `template-example-data.json` into the build output — and therefore into `template.zip` (`npm run zip` runs `build.sh`, which zips the whole build output). The DSPLAY CMS reads these two files to auto-detect a template's variables and seed default preview values, instead of requiring manual registration. See [@dsplay/template-manifest](https://www.npmjs.com/package/@dsplay/template-manifest) for exactly what it detects.

## Commands

- `npm start` — dev server (Vite).
- `npm run build` — production build (runs the linter first via the `prebuild` script).
- `npm test` / `npm run test:watch` — Vitest.
- `npm run linter` / `npm run linter:fix` — ESLint on `src`.
- `npm run zip` — builds, then runs `build.sh` to produce `template.zip` ready for the [DSPLAY Web Manager](https://manager.dsplay.tv/template/create). `build/` and `template.zip` are gitignored.

## Dependency management

Regular npm dependencies, not vendored files — `npm outdated` / `npm update` for in-range bumps. For an out-of-range (typically major) bump, apply it deliberately and verify `npm start`, `npm run build`, and `npm test` still work before committing.

### `vite-plugin-node-polyfills` is load-bearing for the News widget

`rss-parser` (used by `src/components/news/index.jsx`) extends Node's `EventEmitter` and is instantiated at module scope (`const parser = new Parser();`). Vite doesn't polyfill Node builtins the way CRA's webpack config did — by default it externalizes `events`/`stream`/`timers` to browser-incompatible stubs, so `new Parser()` throws `this.removeAllListeners is not a function` at *import* time, crashing the entire app (not just the News widget) before anything renders. `vite.config.js` polyfills exactly `events`/`stream`/`timers` via `vite-plugin-node-polyfills` to fix this — don't remove it without replacing `rss-parser` with something that doesn't need it. This does noticeably grow the bundle (~2x); `parser.parseURL()` (unlike `parseString()`, which is all this template uses) also touches `http`/`https`, which aren't polyfilled — add them to the `include` list first if that method ever gets used.

### Pre-existing bug, out of scope: `vertsical` typo in the Quotes widget

`src/components/quotes/index.jsx` wraps each currency pair in `<div className="block vertsical">` — a typo of `vertical` that predates this migration (confirmed against the commit right before it). No `.vertical`/`.vertsical` CSS rule has matched this in a long time, so each currency's ID and value render side by side instead of stacked. Left as-is per this migration's scope (structural/tooling only, not behavior fixes for pre-existing bugs) — fix `vertsical` → `vertical` and add a `.vertical { flex-direction: column }` rule if this is ever revisited.

### Known pending bump: ESLint 9 -> 10

`eslint`/`@eslint/js` are pinned to `^9.39.5` (latest is `10.x`). Bumping them currently fails on peer dependency conflicts: `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` haven't declared ESLint 10 support yet as of 2026-08-12 — they're still the actively-maintained canonical packages, not abandoned or superseded, just lagging behind the major. `eslint-plugin-react-hooks` already supports it. `eslint-plugin-unicorn` is pinned to `65.0.1` for the same reason (`66.0.0+` requires ESLint `>=10.4`). Don't force this with `--legacy-peer-deps` — re-check peer ranges periodically and bump all of them together once the laggards catch up.

## Commit messages

Every commit title must start with an emoji, followed by a short, imperative summary — e.g. `⬆️ upgrading deps`.

- The human maintainer uses [gitmoji-cli](https://github.com/carloscuesta/gitmoji-cli) for manual commits, so gitmoji conventions (`✨` feature, `🐛` fix, `⬆️` upgrade deps, `♻️` refactor, `🔥` remove code, `📝` docs) are a good default — matches this repo's own git history.
- Agents are not required to stick to the official gitmoji list — pick whichever emoji best represents the actual change in that commit, as long as it's placed at the start of the title.
