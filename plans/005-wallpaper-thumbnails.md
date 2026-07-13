# Plan 005: Serve thumbnail variants in the wallpaper picker

> **Executor instructions**: Follow step by step; run every verification. On any STOP condition, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx scripts public/wallpapers`

## Status

- **Priority**: P2 · **Effort**: M · **Risk**: LOW · **Depends on**: none · **Category**: perf
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

The background picker renders 76 wallpapers (~23.5 MB total, up to 2560px/1.4 MB each — `public/wallpapers/{aero,nature,raycast,resend}`) as ~60px-wide swatch buttons via `style={{ backgroundImage: url(...) }}` (App.jsx wallpaper map, grep `bg-swatch-img`). Opening the Container tab triggers a multi-MB fetch+decode burst to paint thumbnails. Full-res is only needed when a wallpaper is actually applied to the artboard.

## Current state

- `src/App.jsx`: `WALLPAPER_GROUPS` (~:332) builds URLs via helpers `rc/rs/nt/ae` → `/wallpapers/<dir>/<file>.webp`. The swatch button uses `wp.url` for BOTH the thumbnail background and the applied artboard background (`setArtboardBg(\`url(${wp.url}) center/cover\`)`).
- No image build pipeline exists; `public/` is served verbatim by Vite.
- Node ≥ 20 available; `sharp` is the standard tool for this.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Generate thumbs (after step 1) | `node scripts/generate-thumbs.mjs` | writes `public/wallpapers/thumbs/**` |
| Build | `npm run build` | `✓ built` |

## Scope

**In scope**: `scripts/generate-thumbs.mjs` (create), `package.json` (devDep `sharp`, script `thumbs`), `public/wallpapers/thumbs/` (generated output, committed), `src/App.jsx` (swatch background URL only).

**Out of scope**: the full-res wallpapers themselves (do not recompress/rename); the applied-background URL (must remain full-res); CSS.

## Git workflow

Branch `advisor/005-wallpaper-thumbs`; do NOT push.

## Steps

### Step 1: Thumbnail generation script

`npm i -D sharp`. Write `scripts/generate-thumbs.mjs`: for every `public/wallpapers/{aero,nature,raycast,resend}/*.webp`, emit `public/wallpapers/thumbs/<dir>/<file>.webp` at width 240 (keep aspect), quality 70, skip if output exists and is newer than input. Add `"thumbs": "node scripts/generate-thumbs.mjs"` to scripts.
**Verify**: `npm run thumbs` → prints count; `du -sh public/wallpapers/thumbs` → total well under 1 MB; file count equals source count (76 at planning time).

### Step 2: Point swatches at thumbs

In the wallpaper swatch render, background becomes the thumb URL: derive `thumbUrl = wp.url.replace('/wallpapers/', '/wallpapers/thumbs/')`. The `onClick` `setArtboardBg` keeps using `wp.url` (full-res).
**Verify**: `npm run dev` → Network tab on first Container-tab open: wallpaper requests are all from `/wallpapers/thumbs/` and each < 25 KB; clicking a wallpaper loads the full-res file and the artboard shows it crisp.

### Step 3: Guard against missing thumbs

If a thumb 404s the swatch shows empty — add `onError`-equivalent safety: since these are CSS backgrounds, instead verify completeness statically: extend the script to exit non-zero if any source lacks a thumb, and note in `plans/README.md` that adding a wallpaper requires `npm run thumbs`.
**Verify**: delete one thumb, `npm run thumbs` regenerates it and exits 0; `node scripts/generate-thumbs.mjs --check` (implement `--check` as verify-only mode) exits non-zero when a thumb is missing.

## Test plan

Manual network verification (step 2) + the `--check` mode as the machine gate.

## Done criteria

- [ ] `node scripts/generate-thumbs.mjs --check` exits 0
- [ ] First picker paint fetches only `/wallpapers/thumbs/**` (Network evidence in PR)
- [ ] Applied backgrounds still full-res (artboard + export unchanged)
- [ ] `npm run build` exits 0

## STOP conditions

- `sharp` fails to install on this machine (report platform error; do not swap in a different image library without noting it).
- Any wallpaper is referenced by a URL pattern other than `/wallpapers/<dir>/<file>.webp` (the string-replace derivation breaks).

## Maintenance notes

New wallpapers require running `npm run thumbs` (or wire it as a `prebuild` script — deliberate follow-up, left out to keep builds fast).
