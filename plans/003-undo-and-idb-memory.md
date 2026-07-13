# Plan 003: Slim undo snapshots and debounce IndexedDB persistence

> **Executor instructions**: Follow step by step; run every verification. On any STOP condition, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx`
> Re-locate symbols by grep; if a named symbol is missing, STOP.

## Status

- **Priority**: P1 · **Effort**: M · **Risk**: MED · **Depends on**: none (001 recommended first) · **Category**: perf
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

Two related memory/jank problems, verified at planning time:

1. **Undo**: `pushUndo` does `undoStack.current.push(JSON.stringify(prev))` (App.jsx:713) with `MAX_UNDO = 50` (:528). Each layer object carries `src` (base64 dataURL of the full image) and, for videos, `videoSrc` (base64 of the entire MP4). Fifty snapshots × several MB each, mirrored again on the redo stack (:731/:744) → hundreds of MB of heap; each push is also a synchronous full stringify on the edit path.
2. **IndexedDB**: a `useEffect` persists on EVERY `images` reference change (`saveToIDB('images', images)`, ~:700–705), and drag handlers call `setImages` per mousemove — so a drag serializes and writes the full dataset dozens of times per second, opening a new DB connection each call (`saveToIDB` ~:544).

## Current state

- `src/App.jsx`:
  - `pushUndo` (:711–716), `undo` (:728–740), `redo` (:741–756), `setImagesWithUndo` (:718–724). Note: `pushUndo` is currently called INSIDE `setImages` updaters (a purity problem — fix as part of step 1's restructure only where trivially safe; see STOP conditions).
  - Layer shape (created in `handleImageUpload`, ~:869–940): `{ id, src, name, x, y, width, height, borderRadius, borderSize, borderColor, frameStyle, animation, easing, animDuration, delay, exit*, isVideo, videoSrc, videoDuration, naturalWidth, naturalHeight, zoom, opacity? }` — verify by reading the object literal before starting.
  - `saveToIDB(key, value)` / `loadFromIDB(key)` (~:530–560) — open a fresh `indexedDB.open` per call.
- Convention: refs for mutable non-render state (`undoStack`, `redoStack`, `panStart`) — follow it.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Build | `npm run build` | `✓ built` |
| Tests | `npm test` | pass (if plan 001 landed) |
| Dev (manual) | `npm run dev` | localhost:5173 |

## Scope

**In scope**: `src/App.jsx` (undo/redo block, saveToIDB/loadFromIDB, the images-persist effect).

**Out of scope**: sessionStorage settings persistence; the layer object shape as stored in IDB (must stay identical so existing users' saved images still load); export pipeline.

## Git workflow

Branch `advisor/003-undo-idb-memory`; commit per step; do NOT push.

## Steps

### Step 1: Split media out of undo snapshots

Add a module-level (or ref) asset map: `assetsRef.current = Map<id, {src, videoSrc}>`. On upload, register assets; keep `src`/`videoSrc` ON the live layer objects (nothing else changes). Change `pushUndo(prev)` to stringify `prev.map(({src, videoSrc, ...rest}) => rest)`; change `undo`/`redo` restore to re-attach `src`/`videoSrc` from the asset map by `id`. If an id is missing from the map on restore (e.g. layer deleted then undone), re-attachment source of truth is the CURRENT images array first, then the asset map; if both miss, drop the layer and `console.warn`.

**Verify**: `npm run build`; manual: upload 2 images + 1 mp4, move/resize repeatedly, undo ×10 / redo ×10 → geometry restores correctly, images/videos still render. In DevTools console: `JSON.stringify(...)` size of one snapshot — confirm it contains no `data:` URLs: run a drag then inspect — simplest check: add a temporary `console.log(entry.length)` in pushUndo; entry length should be < 10 KB for 3 layers (was multi-MB).

### Step 2: Purity guard for pushUndo (minimal)

Where `pushUndo` runs inside a `setImages` updater (`setImagesWithUndo`, drag handlers), add an idempotency key: `pushUndo` takes the serialized string, and skips the push if it `===` the current stack top. This neutralizes StrictMode/concurrent double-invocation without restructuring call sites.

**Verify**: in dev (StrictMode double-render), perform one edit → undo stack grows by exactly 1 (temporary `console.log(undoStack.current.length)`).

### Step 3: Debounce + connection-reuse for IDB

Cache the opened DB: module-level `let _dbPromise = null; function getDB() { if (!_dbPromise) _dbPromise = openDB(); return _dbPromise }` (mirror existing open logic incl. `onupgradeneeded`). Replace the images-persist effect body with a trailing debounce (~400 ms) via `setTimeout` in the effect + cleanup `clearTimeout`; write with `getDB()`.

**Verify**: manual: drag a layer continuously for 3 s → in DevTools → Application → IndexedDB, the write happens after release (or at most a couple of times), not continuously; refresh page → layers restore.

## Test plan

If plan 001's harness exists: add `src/undoSnapshot.test.js` for the strip/re-attach round-trip (pure functions — extract `stripMediaForSnapshot(images)` and `attachMedia(snapshot, current, assets)` as named exports of a small module so they're testable). Otherwise manual checks in steps.

## Done criteria

- [ ] Undo snapshot for 3 layers is < 10 KB (no `data:` substrings: temporary assertion or manual check noted in commit body)
- [ ] Undo/redo of move, resize, radius, padding all restore correctly with images visible
- [ ] Page refresh restores layers from IDB
- [ ] `npm run build` exits 0; no files outside scope modified

## STOP conditions

- The layer object shape read from IDB on load fails to render after your change (persistence contract broken).
- Undo restore shows blank layers (asset re-attachment failed) after one fix attempt.
- Restructuring `pushUndo` call sites requires touching drag logic beyond adding the idempotency check.

## Maintenance notes

Project save/load (plan 006) should reuse `stripMediaForSnapshot`/`attachMedia` — media-vs-state separation is the same problem. If layers gain new blob-like fields, they must be added to the strip list.
