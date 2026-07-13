# Plan 001: Establish a verification baseline (Vitest + characterization tests)

> **Executor instructions**: Follow step by step. Run every verification command and confirm the expected result before the next step. On any STOP condition, stop and report. When done, update your row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 76c7142..HEAD -- src/App.jsx package.json`
> If `src/App.jsx` changed since planning, re-locate the symbols named below by grep before proceeding; if a symbol is gone, STOP.

## Status

- **Priority**: P1 · **Effort**: L · **Risk**: LOW · **Depends on**: none · **Category**: tests
- **Planned at**: commit `76c7142`, 2026-07-13

## Why this matters

Framey (framey.design) is a browser tool whose core guarantee is "the exported MP4/GIF/PNG matches the on-screen preview." The repo has zero tests and no test script — every refactor of the 3,400-line `src/App.jsx` is unguarded. This plan adds Vitest plus characterization tests for the pure math that both preview and export depend on, creating the safety net that plans 002–004 require.

## Current state

- `package.json` scripts: only `dev`, `build`, `lint`, `preview`. No test runner installed.
- All logic lives in `src/App.jsx`. The pure functions to characterize are module-level (not inside the component):
  - `applyEasing(t, easing)` — ~line 80, a switch over 25 easing ids (`linear`, `ease-in-quad` … `snap`). Deterministic math, no DOM.
  - `naturalSort(a, b)` — grep for `const naturalSort`.
  - Tile builders `getNoiseTile/getDitherTile/getScanlineTile` use `document.createElement('canvas')` — jsdom can't run them without a canvas polyfill; SKIP these.
- Repo conventions: plain JavaScript (no TS), ESM (`"type": "module"`), 2-space indent, no semicolons at line ends in most of App.jsx.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm install` | exit 0 |
| Build | `npm run build` | `✓ built` |
| Tests (after this plan) | `npm test` | all pass |

## Scope

**In scope**: `package.json` (add devDeps + `test` script), `vitest.config.js` (create), `src/easing.js` (create — extracted pure functions), `src/easing.test.js` (create), `src/App.jsx` (ONLY: delete the moved functions and add `import { applyEasing, ... } from './easing'`).

**Out of scope**: any behavior change to easing math; any component extraction; canvas/tile code; CSS; `public/`.

## Git workflow

Branch `advisor/001-verification-baseline`; one commit per step; message style matches repo (`Short imperative summary` — see `git log --oneline -5`). Do NOT push.

## Steps

### Step 1: Install Vitest

`npm install -D vitest` and add `"test": "vitest run"` to scripts.
**Verify**: `npx vitest --version` → prints a version.

### Step 2: Extract pure easing math to `src/easing.js`

Move `EASING_OPTIONS`, `applyEasing` (and, if present at module scope, `applyEasingOut` / any pure easing helper — grep `applyEasing` for all call sites) from `src/App.jsx` into `src/easing.js` with named exports. In `App.jsx`, remove the moved code and import them. Do not alter any function body — this is a move, character-identical bodies.
**Verify**: `npm run build` → `✓ built`; `git diff src/App.jsx | grep "^+" | grep -c "case 'ease-in-quad'"` → 0 (no reimplementation, only import added).

### Step 3: Characterization tests for easing

Create `src/easing.test.js`. For EVERY id in `EASING_OPTIONS`, assert: `applyEasing(0, id) === 0`, `applyEasing(1, id) === 1`, and snapshot `applyEasing(t, id)` at t = 0.25, 0.5, 0.75 using `toMatchInlineSnapshot` or explicit `toBeCloseTo` values captured from a first run. Add monotonicity checks only for the non-special groups (`linear`, `ease-in-*`, `ease-out-*`, `ease-in-out-*`), not for `bounce-out/overshoot/elastic-out/impulse/swing/snap` (they intentionally over/undershoot).
**Verify**: `npm test` → all pass, ≥ 25 tests.

### Step 4: Wire into the workflow

Append a line to `plans/README.md` status table. If the repo later adds CI, `npm test` is the gate — note this in the PR description.
**Verify**: `npm test && npm run build && npm run lint || true` — test+build exit 0 (lint is known-red pre-existing; do not attempt to fix it in this plan).

## Test plan

Covered by steps 2–3 (the tests are the deliverable). Edge cases: `t<0` returns 0, `t>1` returns 1 (guards at top of `applyEasing`).

## Done criteria

- [ ] `npm test` exits 0 with ≥ 25 passing tests
- [ ] `npm run build` exits 0
- [ ] `src/App.jsx` no longer defines `applyEasing` (grep returns only the import)
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` row updated

## STOP conditions

- `applyEasing` is referenced via closure over component state (it isn't at planning time — it's pure); if you find otherwise, STOP.
- Any test requires DOM/canvas to pass.
- Build fails after the extraction and one fix attempt.

## Maintenance notes

Future animation-math changes must update snapshots deliberately — a snapshot diff IS the drift alarm for preview/export parity. Plan 002 builds directly on this file layout.
