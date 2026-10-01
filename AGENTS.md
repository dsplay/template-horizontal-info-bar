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
scripts/
  pack.mjs                   <-- zips the Vite build output into template.zip (Windows/macOS/Linux)
```

## File and folder naming

- **kebab-case everywhere** in `src/` (and anywhere else in this repo we author ourselves) — folders, JS/JSX files, Sass files, test files. Doesn't apply to files whose name is a fixed convention from tooling (`package.json`, `vite.config.js`, etc.) or to vendored/third-party assets we don't control the naming of.
- **Author styles as `.sass` (indented syntax), never `.css`** — this applies to our own hand-authored stylesheets specifically; it does not apply to vendored or tool-generated CSS we don't hand-edit (a self-hosted Google Fonts `@font-face` file, a Flaticon/IcoMoon icon-font export, a vendored library like Bootstrap) — those stay `.css` since they'd be regenerated/replaced wholesale, not edited by hand. `.sass`'s indented syntax has no braces or semicolons — converting a `.css` file means rewriting it to the indented syntax, not just renaming it.
- **Every component gets its own folder with an `index.jsx`.** For a simple component, `index.jsx` *is* the component. For one that grows into several files, `index.jsx` becomes a barrel re-exporting the folder's public API.
- **Always import a component by its folder, never by reaching into `index`** — `import Weather from '../weather'`, never `.../weather/index`.
- Non-component helpers (e.g. `src/utils/logger.js`) live outside `components/` and don't need the folder+`index.jsx` treatment — plain kebab-case files are fine.
- Enforced automatically by ESLint's `unicorn/filename-case` rule for the naming half of this; the folder+`index.jsx`+import-by-folder structure is not machine-checked, just convention.

## Package identity

`package.json`'s `"name"` must identify this template, not the boilerplate it was cloned from — see [`template-boilerplate-react`](https://github.com/dsplay/template-boilerplate-react)'s AGENTS.md for the full convention. This template's is `dsplay-template-horizontal-info-bar` (previously `@dsplay/template-horizontal-bar`, which didn't even match the repo's own name).

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

- `public/dsplay-data.js` defines `dsplay_config`/`dsplay_media`/`dsplay_template` mock globals used only in **development**. `scripts/pack.mjs` blanks its content in the production build — the DSPLAY Android app injects the real `window.DSPLAY.getData()` before any script runs.
- This template reads `dsplay_template`/`config` values via [`@dsplay/react-template-utils`](https://github.com/dsplay/react-template-utils)'s hooks (`useTemplateVal`/`useTemplateBoolVal`/`useConfig`), called inside each component's function body — matching every other migrated template. It used to read [`@dsplay/template-utils`](https://github.com/dsplay/template-utils)'s `tval`/`tbval`/`config` directly at module scope instead; that was a deliberate "don't fix what isn't broken" call made during the initial 2026 migration, later reversed at the maintainer's request. `@dsplay/template-utils` is no longer a direct dependency (still pulled in transitively via `@dsplay/react-template-utils`).
- **New `dsplay_template` variable keys should use `snake_case`** (e.g. `background_color`, not `backgroundColor`) — the DSPLAY CMS Manager auto-generates each variable's on-screen label from its key name, and snake_case reads more naturally there. This only applies to variables added from now on — never rename this template's existing keys just to match, since they're already registered/in use in production CMS configurations.
- Each widget independently fetches its own data (weather via DSPLAY's own API, currency quotes via a free public API, RSS via DSPLAY's own rss-gateway) and caches the result in `localStorage` with its own TTL/version key, refreshing on its own interval. `src/utils/logger.js` gates the diagnostic `console.log`/`console.error` calls so they're silent in production builds but still visible when debugging a dev build via remote WebView inspection.
- Each widget is independently optional — `src/components/app/index.jsx` only renders the ones whose required variable(s) are set (e.g. `Weather` renders nothing without both `latitude`/`longitude`).

## Browser/WebView compatibility (Android SDK 23 minimum)

DSPLAY's Android app supports devices back to Android 6.0 (API 23). On locked-down signage hardware that never receives WebView updates via Play Store, the actual JS engine can be stuck around the Chrome ~40-51 era that shipped with that OS generation — not a modern evergreen browser. `@vitejs/plugin-legacy` exists specifically to cover this: it builds a modern ES-module bundle plus a transpiled+polyfilled "legacy" nomodule bundle for anything the `browserslist` target in `package.json` doesn't natively support.

Two things must never regress, or the legacy bundle silently stops protecting old devices while still *looking* correctly configured:

- **`package.json`'s `browserslist` must keep `Chrome >= 45` and `Android >= 4.4`** (alongside the generic `>0.2%`/`not dead`/etc. entries) — dropping these two narrows the resolved target list to whatever's "current" (verify with `npx browserslist`), which silently stops emitting transpiled code for anything old, even though `@vitejs/plugin-legacy` stays nominally wired up.
- **`vite.config.js`'s `build.minify` must stay `'terser'`, not the default `oxc`** — `oxc`'s minifier has a known bug where it reintroduces `?.`/`??` into the legacy chunk after Babel already expanded them away, silently breaking the one guarantee the legacy build exists to provide.

After touching either of these, verify by actually running `npm run build` and grepping the emitted `build/assets/index-legacy-*.js` for untranspiled arrow functions (`=>`) or real `?.`/`??` usage — a config that looks right can still emit a broken legacy bundle if a dependency version bump reintroduces one of these, so don't assume correctness from the config file alone.

## Template variable manifest

`vite.config.js` registers `@dsplay/template-manifest`'s Vite plugin, which on every build statically scans `src/` for `tval`/`useTemplateVal`-style reads and captures `public/dsplay-data.js` as example data, writing `template-variables.json` + `template-example-data.json` into the build output — and therefore into `template.zip` (`npm run zip` runs `scripts/pack.mjs`, which zips the whole build output). The DSPLAY CMS reads these two files to auto-detect a template's variables and seed default preview values, instead of requiring manual registration. See [@dsplay/template-manifest](https://www.npmjs.com/package/@dsplay/template-manifest) for exactly what it detects.

## Commands

- `npm start` — dev server (Vite).
- `npm run build` — lints, then builds for production.
- `npm test` / `npm run test:watch` — Vitest.
- `npm run linter` / `npm run linter:fix` — ESLint on `src`.
- `npm run zip` — builds, then runs `scripts/pack.mjs` to produce `template.zip` ready for the [DSPLAY Web Manager](https://manager.dsplay.tv/template/create). `build/` and `template.zip` are gitignored.

`build`/`zip` chain their steps with `&&` directly in the script (`"build": "npm run linter && vite build"`, `"zip": "npm run build && ..."`) rather than `prebuild`/`prezip` lifecycle hooks — `.npmrc`'s `ignore-scripts=true` (see below) silently skips `pre*`/`post*` hooks for `npm run-script` too, not just install scripts, so a `prezip` step would never actually run and `npm run zip` would silently package a stale/missing `build/`. Confirmed live on 2026-10-01: both `prebuild` and `prezip` were being skipped this way. Keep new multi-step scripts explicit for the same reason — don't reach for `pre*`/`post*` naming in this repo.

## Supply chain hardening

- `.npmrc` sets `ignore-scripts=true` (no dependency lifecycle scripts run on install), `min-release-age=3` (npm refuses versions younger than 3 days) and `save-exact=true`.
- **Dependencies must ALWAYS be pinned to an exact version** — never `^`, `~`, `>=`, `latest` or any other range, in `dependencies` and `devDependencies` alike. When adding or bumping a package, use `npm install <pkg>@<version>` (`save-exact=true` in `.npmrc` handles it) and check `package.json` afterwards; fix any range that slips in. `src/sanity.test.js` enforces this, plus `.npmrc` and Dependabot settings and the legacy-WebView invariants above.
- `.github/dependabot.yml` uses a 3-day cooldown (7 days for majors).
- Currently no dependency needs its install script. If one ever does, add a `setup` script (`npm install && npm rebuild <pkg>`) and document it in README.md.

## Dependency management

Regular npm dependencies, not vendored files — versions are pinned, so bump explicitly (`npm outdated`, then `npm install <pkg>@<version>`) or merge Dependabot PRs. For a major bump, apply it deliberately and verify `npm start`, `npm run build`, and `npm test` still work before committing.

### Fixed: `vertsical` typo in the Quotes widget

`src/components/quotes/index.jsx` used to wrap each currency pair in `<div className="block vertsical">` — a typo of `vertical` that predated this migration (confirmed against the commit right before it) and meant no CSS ever matched it, so each currency's ID and value rendered side by side instead of stacked. Fixed to `vertical`, with a matching `.vertical { flex-direction: column }` rule restored in `src/style.sass`.

### Fixed: every per-component `style.sass` except `app`'s was never imported, so its CSS never bundled

When the original monolithic `index.scss` was split into one `style.sass` per component during the migration, only `src/components/app/index.jsx` actually got an `import './style.sass';` line added — `clock`, `weather`, `quotes`, `news`, and `sponsor` did not. Their stylesheets existed on disk with the right rules but were never part of the JS module graph, so none of their CSS was ever bundled or applied — every widget rendered using only the shared `.block` layout, with no margins, sizing, or spacing of its own. This was the actual cause of "looks different from before" and of the Sponsor/News widgets appearing to render nothing (their sizing came entirely from the missing CSS). Fixed by adding the missing import to all five components — verify with a real build that `build/assets/*.css` contains rules for every component, not just `.App`/`.block`/`html`/`body`.

### Fixed: News widget now calls DSPLAY's own `rss-gateway` instead of chaining public CORS proxies

`src/components/news/index.jsx` used to fetch the RSS feed's raw XML through a chain of free public CORS proxies (`api.allorigins.win`, `api.codetabs.com`, `corsproxy.io`, tried in sequence) and parse it client-side with `rss-parser`, because `rss_url` is typically cross-origin and a plain browser `fetch`/`axios` can't read it directly. Those proxies were individually flaky (the same request to the same proxy could succeed then `503` moments later) — the fallback chain only mitigated that, it didn't fix it.

The widget now calls `GET https://api.dsplay.tv/rss/last-news?url=<rss_url>` — a DSPLAY-hosted Lambda (`dsplay-api`'s `services/rss-gateway`) that fetches and parses the feed server-side (RSS 2.0, RSS 1.0/RDF, and Atom, including some publisher-specific quirks), normalizes it to a common JSON shape (`{ title, description, link, logo, url, items: [{ id, title, link, publishedAt, categories, description, content, images[] }] }`), and sets its own `Access-Control-Allow-Origin: *` — no CORS proxy needed at all. It also validates/reachability-checks images and caches per feed url server-side (own DynamoDB-backed cache), same spirit as the Weather widget's `api.dsplay.tv/weather/current` migration. `rss-parser` and `vite-plugin-node-polyfills` (and its only reason for existing, see below) were removed entirely as a result.

- **The example `rss_url` in `public/dsplay-data.js` used to be `https://www.reddit.com/.rss`**, which is a bad example independent of the proxy-vs-gateway question — Reddit actively blocks bot-like traffic (confirmed via a direct `curl` returning `403`), so even the gateway's own server-side fetch would likely get blocked the same way. Changed to `https://feeds.bbci.co.uk/news/rss.xml`, which isn't hostile to automated fetchers. A real customer's own feed is very likely not Reddit and won't have this specific problem.
- `rss-gateway`'s own cache is meant to hand back `expiresAt` ~15 minutes in the future (`K_SUCCESS_CACHE_TIME_MIN` in its `util/config.js`) — a live check against the deployed prod endpoint on 2026-10-01 showed `expiresAt` pinned to the exact moment the entry was cached instead, which looks like a deploy lagging the source by a few weeks rather than a client-side concern. The widget doesn't depend on this being correct — it keeps its own independent 9-minute `localStorage` staleness window (unchanged from before), so a stale `expiresAt` from the gateway just means it's hit a *bit* more often than ideal, never a correctness or crash issue. Worth flagging to whoever owns `dsplay-api` if it's still off next time someone's in there.

### Fixed: `public/dsplay-data.js` had two dead API keys (`currency_api_key`, `weatherbit_api_key`)

Neither is read anywhere in `src/` (grepped every `useTemplateVal`/`useTemplateBoolVal` call) or present in the generated `template-variables.json` manifest — both widgets moved off the providers that needed them a while ago: Weather calls `api.dsplay.tv/weather/current` (a keyless DSPLAY-hosted proxy, see above), and Quotes calls the free/keyless `@fawazahmed0/currency-api` via jsdelivr. Removed the two live values and their commented-out alternates from the example data — they were unused leftovers that happened to look like real credentials sitting in a public example file. If a future provider swap ever needs an API key again, add it back deliberately alongside the code that actually reads it.

### Fixed: `npm run zip` didn't work on Windows at all

`build.sh` (bash + the system `zip` CLI) was the only thing `npm run zip` ran after building — neither ships on Windows, not even under Git Bash (Git for Windows doesn't bundle `zip`/`unzip`). Replaced with `scripts/pack.mjs`, a plain Node script (`fs` + the `archiver` devDependency, pinned to `7.0.1` — the long-established CJS-style `archiver('zip', opts)` API, not `8.x`'s from-scratch ESM rewrite with a very different class-based API and far less real-world mileage) that does the exact same thing (strip `build/test-assets`, write the `dsplay-data.js` placeholder, zip `build/`'s contents flat into `template.zip`) with no OS-specific tooling at all. `npm run zip` now works identically on Windows, macOS and Linux.

### Known pending bump: ESLint 9 -> 10

`eslint`/`@eslint/js` are pinned to `9.39.5` (latest is `10.x`). Bumping them currently fails on peer dependency conflicts: `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` haven't declared ESLint 10 support yet as of 2026-08-12 — they're still the actively-maintained canonical packages, not abandoned or superseded, just lagging behind the major. `eslint-plugin-react-hooks` already supports it. `eslint-plugin-unicorn` is pinned to `65.0.1` for the same reason (`66.0.0+` requires ESLint `>=10.4`). Don't force this with `--legacy-peer-deps` — re-check peer ranges periodically and bump all of them together once the laggards catch up.

## Commit messages

Every commit title must start with an emoji, followed by a short, imperative summary — e.g. `⬆️ upgrading deps`.

- The human maintainer uses [gitmoji-cli](https://github.com/carloscuesta/gitmoji-cli) for manual commits, so gitmoji conventions (`✨` feature, `🐛` fix, `⬆️` upgrade deps, `♻️` refactor, `🔥` remove code, `📝` docs) are a good default — matches this repo's own git history.
- Agents are not required to stick to the official gitmoji list — pick whichever emoji best represents the actual change in that commit, as long as it's placed at the start of the title.
