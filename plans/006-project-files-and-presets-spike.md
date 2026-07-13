# Plan 006 (design spike): Project save/load (.framey.json) + motion presets

> **Executor instructions**: This is a SPIKE — the deliverable is a design doc + a throwaway prototype branch, not shipped UI. Follow steps; on any STOP condition, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx`

## Status

- **Priority**: P2 · **Effort**: M (spike: ~a day) · **Risk**: LOW · **Depends on**: plans/003 (media/state separation helps the schema) · **Category**: direction
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

Framey has export (MP4/GIF/PNG/WebP) but no import: all work lives in one implicit slot (sessionStorage `animate_*` keys + one IndexedDB `'images'` entry) that can't be named, duplicated, shared, or reliably reopened. Meanwhile the entire app state is already serializable — undo literally `JSON.stringify`s it (App.jsx:713). A versioned project file plus reusable motion presets (`batchAnimation/batchEasing/batchAnimDuration/batchDelay/batchOverlap/batchExit*/firstFrame*` state, ~:647–658, is already a self-contained preset object) turns the tool from a one-shot toy into something people return to — and presets double as starter templates, the main on-ramp competitors like Shots.so use.

## Current state

- Settings persisted (13 keys) via `loadSession`/`sessionStorage.setItem('animate_*')` (~:617–697).
- Layers persisted whole (incl. base64 `src`/`videoSrc`) to IDB key `'images'` (~:700–705).
- Export menu JSX ~:2331–2359 (where Open/Save actions would live); empty state `drop-card` ~:2380 (where templates would surface).

## Spike deliverables (all under `plans/spike-006/` + one prototype branch)

1. **Schema doc** `plans/spike-006/schema.md`: `{ version: 1, settings: {...}, presets?: [...], layers: [{...}], assets: { [id]: { kind: 'image'|'video', dataUrl } } }` — decide: assets embedded (self-contained file, huge) vs. re-uploaded on open (small file, lossy UX) vs. both (a "include media" checkbox). Recommend one with rationale. Define forward-compat rules (unknown fields ignored; version gate with a clear error).
2. **Safety rules**: max accepted file size, JSON.parse in try/catch, validate every field against a whitelist before setState (a project file is untrusted input — never `eval`, never spread unknown keys into state), dataURL mime whitelist (`image/*`, `video/mp4`).
3. **Prototype branch** `spike/project-files`: Save (serialize → `Blob` → download `name.framey.json`) and Open (file input → validate → hydrate `setImages` + each setting setter). No polish. Demonstrate a full round-trip.
4. **Preset note**: one page on preset shape = the `batch*/firstFrame*` slice; built-ins as a const array; "Save current as preset" writing to localStorage; where they surface (Animate tab + empty state).
5. **Open questions list**: video re-embedding cost, quota limits, whether IDB should become multi-project keyed storage now or later.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Dev | `npm run dev` | localhost:5173 |
| Build | `npm run build` | `✓ built` |

## Scope

**In scope**: `plans/spike-006/**` docs; prototype branch (may touch `src/App.jsx` freely — it will not merge).

**Out of scope**: merging any prototype code to main; cloud/link sharing; multi-project IDB migration (document, don't build).

## Done criteria

- [ ] `plans/spike-006/schema.md` exists with a recommended asset strategy and validation rules
- [ ] Prototype branch demonstrates save → reload page → open → identical artboard (screen recording or step list in the doc)
- [ ] Open-questions list written
- [ ] Nothing from the spike merged to main

## STOP conditions

- Round-trip fails for video layers after one attempt — document why (likely dataURL size); that becomes the headline open question, not a blocker to finishing the doc.

## Maintenance notes

The schema doc becomes the contract for the real implementation plan (write it as plan 007 after review). Keep the schema aligned with `stripMediaForSnapshot` from plan 003.
