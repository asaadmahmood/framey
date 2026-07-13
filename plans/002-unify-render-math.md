# Plan 002: Unify preview and export animation math into one pure module

> **Executor instructions**: Follow step by step; run every verification. On any STOP condition, stop and report. Update your row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx`
> Re-locate symbols by grep if line numbers moved; if a named symbol is missing, STOP.

## Status

- **Priority**: P1 · **Effort**: M · **Risk**: MED · **Depends on**: plans/001-verification-baseline.md · **Category**: tech-debt
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

The DOM preview and the canvas export each implement the *same* layer animation timeline separately. Preview: `getInitialStyle` / `getInterpolatedStyle` / `getExitInterpolatedStyle` / `getImageAnimStyle` (App.jsx ~1610–1712) produce CSS opacity/transform strings. Export: `renderFrame`'s inline `applyAnim` (~line 1983) re-derives numeric `{opacity, tx, ty, sx, sy}` with its own hardcoded constants. Example of the duplicated constants, verified at planning time:

```js
// preview, ~1644:
case 'scaleUp': return { opacity: p, transform: `scale(${0.5 + 0.5 * p})` }
// export, inside applyAnim (~1987 area):
case 'slideUp': ty = -60 * p; break
```

Any tweak to slide distance, scale range, or exit behavior must be mirrored by hand or exports silently diverge from the preview — the product's core guarantee. One pure function must own this math; both renderers consume it.

## Current state

- `src/App.jsx` — everything below is inside this file:
  - `ANIMATION_TYPES` (~line 26): ids `fadeIn, slideUp, slideDown, slideLeft, slideRight, scaleUp, scaleDown`.
  - `getInitialStyle(animation)` (grep it), `getInterpolatedStyle(animation, p)` (~1637), `getExitInterpolatedStyle(animation, p)` (~1650), `getImageAnimStyle(img)` (~1664) — computes entry window (`img.delay`, `img.animDuration`), hold, exit window from component state (`playbackTime`, `showFirstFrame`, `firstFrameDuration`, `firstFrameDelay`, `duration`), returns `{opacity, transform}` CSS.
  - `renderFrame(ctx, bgCanvas, loadedImages, t, w, h)` (~1875): per image computes the same windows, then `applyAnim(animation, p, isExit)` (~1983) returns numeric transforms used by `ctx.translate/scale/globalAlpha`.
  - First-frame-hold logic duplicated at ~1675 (preview) and ~1939 (export).
- After plan 001, pure math lives in `src/easing.js` — follow that convention (plain JS module, named exports).

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Tests | `npm test` | all pass |
| Build | `npm run build` | `✓ built` |
| Dev (manual feel check) | `npm run dev` | serves localhost:5173 |

## Scope

**In scope**: `src/animMath.js` (create), `src/animMath.test.js` (create), `src/App.jsx` (replace both implementations with calls into animMath).

**Out of scope**: `src/easing.js` internals; effect overlays (noise/dither/etc.); background rendering (`loadBgForExport`); any change to *what* the animations look like — output must be numerically identical.

## Git workflow

Branch `advisor/002-unify-render-math`; commit per step; do NOT push.

## Steps

### Step 1: Write the pure timeline function (new code, nothing wired)

Create `src/animMath.js` exporting `computeLayerFrame(img, t, timeline)` where `timeline = { showFirstFrame, firstFrameDuration, firstFrameDelay, duration, isFirstImage }`. It returns `{ visible, opacity, tx, ty, sx, sy }` (numbers; `tx/ty` in px, `sx/sy` scale factors). Port the EXPORT implementation's math (`applyAnim` + its entry/hold/exit window computation) as the single source of truth — the export path is the stricter consumer. Reuse `applyEasing` from `./easing.js`.

**Verify**: `npm test` still passes (new file unused so far); `node -e "import('./src/animMath.js').then(m=>console.log(typeof m.computeLayerFrame))"` → `function`.

### Step 2: Characterization tests

`src/animMath.test.js`: for each of the 7 animation ids × entry mid-point, hold, exit mid-point, before-delay → assert exact `{opacity, tx, ty, sx, sy}` values computed BY HAND from the current export math (copy constants: slide distance 60, scale range 0.5). These pin today's behavior.

**Verify**: `npm test` → all pass.

### Step 3: Switch the export renderer

In `renderFrame`, delete `applyAnim` and the inline window math; call `computeLayerFrame`. Numeric output must be identical — the step-2 tests plus a manual export spot check are the gate.

**Verify**: `npm test` passes; `npm run build` passes; manual: `npm run dev`, add 2 images, Animate tab, export MP4 60fps → downloaded file plays with entry+exit motion identical to preview (eyeball at 0.5×).

### Step 4: Switch the preview renderer

Rewrite `getImageAnimStyle` as a thin adapter: call `computeLayerFrame`, map to CSS: `opacity`, `transform: translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`. Delete `getInitialStyle/getInterpolatedStyle/getExitInterpolatedStyle`. NOTE the preview previously used `transform` strings that may compose scale differently (`scale(${v})` uniform) — `computeLayerFrame` returns sx=sy for uniform scales, so output is equivalent; if you find an animation where preview and export intentionally differed, STOP (that's a product decision, not yours).

**Verify**: `npm test`; `npm run build`; manual: play animation in preview — identical motion to before (compare against the exported MP4 from step 3).

## Test plan

Step 2 is the test plan; pattern after `src/easing.test.js` from plan 001.

## Done criteria

- [ ] `grep -c "applyAnim\|getInterpolatedStyle\|getExitInterpolatedStyle" src/App.jsx` → 0
- [ ] `npm test` exits 0 (incl. ≥ 28 animMath assertions)
- [ ] `npm run build` exits 0
- [ ] Manual preview-vs-export comparison done and noted in the PR/commit body

## STOP conditions

- Plan 001 is not DONE (no test harness) — this plan must not run first.
- Preview and export math turn out to intentionally differ for some animation (see Step 4).
- Any step's verification fails twice.

## Maintenance notes

New animation types now get added in exactly one place (`animMath.js` + a test). The effect-overlay duplication (DOM divs vs canvas fills) is a sibling problem deliberately deferred — same descriptor-table treatment, separate plan.
