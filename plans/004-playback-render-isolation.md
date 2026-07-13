# Plan 004: Stop 60fps playback from re-rendering the whole app

> **Executor instructions**: Follow step by step; run every verification. On any STOP condition, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx`

## Status

- **Priority**: P2 · **Effort**: L · **Risk**: MED · **Depends on**: plans/001, ideally 002 · **Category**: perf
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

`playbackTime` is a `useState` on the ~3,400-line `App` component (App.jsx:641) and the playback loop calls `setPlaybackTime(t)` on every `requestAnimationFrame` (:1588). Every frame therefore reconciles the entire tree — all panels, all timeline rows, every artboard layer (each recomputing `getImageAnimStyle`), the wallpaper grids. Same story for every slider drag. This is the app's dominant jank source and worsens with layer count.

## Current state

- `src/App.jsx`: `playAnimation` (~:1575–1600) — rAF loop with `setPlaybackTime`; artboard layer map (~:2499) calls `getImageAnimStyle(img)` inline; `renderLayersList()` (~:2277) is a plain function re-invoked per render; timeline rows map over `images` inside the same component.
- Only ~9 `useMemo/useCallback` sites exist; no `React.memo` anywhere.
- React 19 — `memo` still works; the React Compiler is NOT enabled (see README note).

## Approach (chosen for lowest risk)

Do not restructure state. During playback, bypass React for the per-frame values:

1. Extract an `ArtboardLayer` component (`React.memo`) receiving `img` + a `timeRef` + static timeline props; it renders the current DOM per layer.
2. The rAF loop writes `timeRef.current = t` and imperatively updates ONLY: each layer's `style.opacity/transform` (via per-layer element refs and the plan-002 `computeLayerFrame`), the playhead line `style.left`, and the time label text. React state `playbackTime` updates at most 10×/s (throttled) for anything else that displays time.
3. Slider-driven states that only affect one panel stay as-is (acceptable), but wrap the artboard layer list and timeline row list in `memo` components so panel-only changes stop reconciling them.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Tests | `npm test` | pass |
| Build | `npm run build` | `✓ built` |
| Profiling (manual) | React DevTools Profiler on `npm run dev` | see done criteria |

## Scope

**In scope**: `src/App.jsx` (playback loop, artboard layer map, timeline rows), new `src/ArtboardLayer.jsx`.

**Out of scope**: export pipeline (already imperative); undo/drag logic; any visual change.

## Git workflow

Branch `advisor/004-playback-isolation`; commit per step; do NOT push.

## Steps

### Step 1: Extract `ArtboardLayer` (memo) with no behavior change

Move the JSX inside the artboard `images.map(...)` into `src/ArtboardLayer.jsx` wrapped in `React.memo`. Pass everything it reads as props (img, isSelected, isPlaying, scale-independent values, callbacks). Callbacks passed must be `useCallback`-stable or the memo is useless — audit each.
**Verify**: `npm run build`; app behaves identically (drag, select, resize).

### Step 2: Imperative playback path

Give each `ArtboardLayer` a `ref` registered in a `Map<id, HTMLElement>`. In the rAF loop, for each layer compute the frame (plan 002's `computeLayerFrame` or `getImageAnimStyle`) and assign `el.style.opacity/transform` directly; update playhead/label via refs; throttle `setPlaybackTime` to 100 ms intervals (it still drives pause-state UI).
**Verify**: manual — play a 6-layer animation; React DevTools Profiler during playback shows App commits at ≤ 10/s (was 60/s). Motion is visually identical.

### Step 3: Memoize timeline rows and layers list

Wrap the timeline row and the layers-panel row in `memo` components keyed by `img.id`, props narrowed to what they display.
**Verify**: Profiler — dragging the Noise slider re-renders the effects panel but NOT timeline rows/artboard layers.

## Test plan

Behavioral: plan 001/002 tests still pass (`npm test`). This plan is verified by profiler evidence + manual playback comparison; record profiler screenshots in the PR.

## Done criteria

- [ ] App commits ≤ 10/s during playback (profiler evidence)
- [ ] Export output unchanged (export one MP4 before/after — same duration & motion)
- [ ] `npm test` and `npm run build` exit 0

## STOP conditions

- Imperative style writes fight React-rendered styles (flicker) after one reconciliation attempt — report the conflicting property.
- Memoized layers break selection/drag (stale callbacks) after one fix pass.
- Plan 002 not landed AND porting `getImageAnimStyle` per-frame math to the loop proves non-trivial.

## Maintenance notes

Once the React Compiler is eventually enabled, revisit: it may make some manual memoization redundant, but the imperative rAF path stays — that's architecture, not memoization.
