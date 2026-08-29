# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static Next.js site (Pages Router) for the NTHU MBA 金門班 cohort: each student fills in a
profile, browses two years of course content, and generates a personalized PDF (cover + course
content + selected group-report PDFs + optional photos/graduation docs) entirely client-side.
No backend, no database — deployed as a static export to GitHub Pages at
`https://<username>.github.io/nthu-mba28-kinmen/`. Full rationale and data-model spec:
`docs/mba-learning-portfolio-spec.md`.

## Commands

```bash
npm install        # install deps
npm run dev        # dev server
npm run build      # next build with output: 'export' -> writes static site to /out
npm run start      # (not used for deploy; export is static) next start for local prod check
npm run lint        # next lint
```

There is no test suite in this repo.

**Windows path-casing gotcha**: this repo's real path is `C:\Users\LM\Desktop\MBALearning`.
If you `cd` into it using different casing (e.g. `desktop\mbalearning`), `npm run build` fails
with `TypeError: Cannot read properties of null (reading 'useContext')` during prerender —
webpack bakes the literal cwd string into a chunk, and a case-mismatch against how
`node_modules` gets resolved elsewhere creates two separate React module instances. Always
`cd` using the exact-case path before running `npm run build`.

## Architecture

**Static export + GitHub Pages subpath.** `next.config.js` sets `output: 'export'` and,
only when `process.env.GITHUB_ACTIONS === 'true'`, sets `basePath`/`assetPrefix` to
`/nthu-mba28-kinmen` (also exposed client-side via `NEXT_PUBLIC_BASE_PATH`). Any hardcoded
asset path used in `<img src>`, `fetch()`, or `<a href>` (i.e. not routed through `next/link`
or `next/image`) **must** be wrapped in `withBasePath()` from `lib/basePath.js`, otherwise
images/PDFs break specifically in the deployed GitHub Pages build while working fine in
`npm run dev`. Repo name is currently hardcoded as `nthu-mba28-kinmen` at the top of
`next.config.js` — update it there if the repo is ever renamed.

**Data lives in `/data`, is read at *build* time only.** `lib/courses.js` uses `fs` inside
`getStaticProps`/`getStaticPaths` to read `data/courses/course-XX.json` — adding a new course
is just adding a new JSON file, no code changes needed (see schema in the spec doc). This only
works server-side at build time; `/data` is never served to the browser.

**Runtime-fetchable *shared* assets live in `/public`, not `/data`.** This is a deliberate
deviation from the original spec doc (which put reports under `/data/reports/`): group-report
PDFs go in `public/reports/course-XX-*.pdf` (filename must start with the course slug, e.g.
`course-01`), course photos go in `public/images/courses/` and are referenced by path in the
course JSON's `photos` array. `pages/courses/[slug].js` and `pages/download.js` scan these
directories with `fs.readdirSync` inside `getStaticProps` to build their file lists. These are
genuinely shared, cohort-wide content — one upload (by the repo owner) serves everyone.

**Graduation certificate/thesis are per-student, NOT shared — do not put them in `/public`.**
Initial design mistakenly treated these like group reports (a shared `public/graduation/`
folder scanned at build time); that's wrong because every student has their own individual
diploma and thesis, and committing them to the public repo would (a) expose personal data
(ID numbers, birthdates on diplomas) to the whole internet and (b) make no sense for a shared
site to only show one person's certificate. Corrected design: `lib/GraduationContext.js` is a
React Context (provided in `pages/_app.js`, wrapping the whole app) holding `{ certificate:
{dataUrl, isPng}, thesis: {bytes, name} }` **in memory only** — `pages/graduation.js` lets a
student upload their own files via `<input type="file">` (converted with `FileReader`), preview
them, and that state is then read directly by `pages/download.js` when building the PDF
(`components/PdfGenerator.jsx`'s `generatePersonalizedPdf` takes `graduationCertificate`/
`graduationThesis` as raw data, not a fetchable path). Nothing here touches localStorage or the
network — it resets on page reload by design, which is fine since it's a one-sitting
upload-then-generate flow. Do not "fix" this by trying to persist it (e.g. to localStorage) —
thesis PDFs can be several MB and would risk hitting localStorage's quota.

**Two separate PDF concerns, don't conflate them:**
- *Online preview* (`components/PdfModal.jsx`): a plain `<iframe>` pointing at the static PDF
  URL, relying on the browser's native PDF viewer for pagination. (An earlier attempt used
  `react-pdf`/`pdfjs-dist` but it broke static-export prerendering on Windows with the same
  `useContext` crash as the casing bug above — removed in favor of the iframe, which is also
  one less dependency.)
- *Personalized export* (`components/PdfGenerator.jsx`): builds a brand-new `PDFDocument` with
  `pdf-lib` — draws a cover page from the profile, draws a text page per selected course, then
  uses `copyPages()` to append the *actual pages* of selected report/graduation PDFs (not links,
  not screenshots — real embedded pages), plus image pages for selected course photos.

**Chinese text in generated PDFs requires a font file that isn't in the repo.** `pdf-lib`'s
built-in `StandardFonts` have no CJK glyphs. `PdfGenerator.jsx`'s `embedChineseFont()` uses
`@pdf-lib/fontkit` to load `public/fonts/NotoSansTC-Regular.ttf` at generation time; if that
file is missing it logs a warning and falls back to no font (Chinese renders as blank/boxes).
The font file must be added manually (see README) — it's intentionally not committed.

**Profile data is never persisted server-side.** `pages/index.js` and `pages/download.js`
both read/write the same `localStorage` key (`mba-profile`) so a student's profile fills in
automatically across pages/visits on their own browser, with no backend involved.

## CI

- `.github/workflows/deploy.yml`: on push to `main`, `npm ci && npm run build`, then
  `actions/upload-pages-artifact` + `actions/deploy-pages` on `/out`. Requires GitHub repo
  Settings → Pages → Source = "GitHub Actions" to be enabled once.
- `.github/workflows/check-file-size.yml`: fails CI on push/PR if any tracked file exceeds
  90MB (soft threshold chosen because contributors are non-technical; a failure just means the
  repo owner manually downloads/compresses/re-uploads that file — see spec doc for full
  rationale on the 90MB/1GB thresholds).
