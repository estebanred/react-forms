# Vitest Test Suite for react-form-lib

## Context

The repo has **zero test infrastructure** — no vitest, no testing-library, no test scripts, no `*.test.*` files. It's a Marketo-backed dynamic form renderer with easy-to-break-silently behavior: 20 field types, a visibility-rules engine with 6 operators, and a hidden-field source resolver (`constant` / `cookie` / `url`) added in PR #6. Regressions in any of these paths produce forms that look fine but submit wrong data or validate inconsistently.

Goal: stand up vitest + @testing-library/react, then lock down the three highest-risk subsystems (validators, visibility rules, hidden-field resolution) and verify each field-type component renders, validates, and reports errors correctly.

Scope per user: utilities + components. Network mocked with fixtures. Repo uses **pnpm**.

## Shape

```
┌────────────── Phase 0: infra ──────────────┐
│ pnpm add -D vitest @testing-library/*      │
│ vitest.config.ts  (jsdom, react plugin)    │
│ src/test/setup.ts   src/test/helpers.tsx   │
│ src/test/fixtures/marketoForm.ts           │
└────────────────────┬───────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
 Phase 1a        Phase 1b        Phase 1c + 1d
 validators.     visibility      fetchMarketo
 test.ts         Rules.test.ts   Form.test.ts
 (it.each by     (operators,     (datatype map,
  field type)     option match,   hidden resolver
                  altLabel)       via fetch)
     │               │               │
     └───────────────┼───────────────┘
                     ▼
               Phase 2: components
   ┌─────────────────┼─────────────────┐
   ▼                 ▼                 ▼
 FieldLayout    field-types/*      FormFields.test
 (label/error)  (render, type,     (visibility flow:
                 validation)        show/hide, clear,
                                    altLabel, filter)
```

Arrows = read-dependencies. Utilities test directly against source; component tests reuse the TanStack harness from `src/test/helpers.tsx`; the `FormFields` integration test exercises the utilities end-to-end through the real rendering path.

## Phase 0 — Infrastructure

**Install** (pnpm, matches existing `pnpm-lock.yaml`):
```
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**New files:**

- `vitest.config.ts` — `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`, plugin `@vitejs/plugin-react` (already a dep). Exclude `node_modules` and build output from coverage.
- `src/test/setup.ts` — `import '@testing-library/jest-dom/vitest'`.
- `src/test/helpers.tsx` — exports `renderField(field: FormField, options?: { defaultValue?: string })`. Internally defines a `Harness` component that calls `useForm({ defaultValues: { [field.name]: '' } })`, renders the single correct component from `FormFields` switch (or takes the component as a param), and returns `{ form, ...RTL }`. Keep it tiny — it's reused by every component test.
- `src/test/fixtures/marketoForm.ts` — one `MarketoFormResponse` fixture covering **all 18** `MarketoDatatype` values, plus three hidden-field variants (`InputSourceChannel` = `constant` / `cookie` / `url`, each with `InputSourceSelector`). Export both the raw fixture and a helper `makeHiddenField(overrides)`.

**Modifications:**

- `package.json` scripts: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:ui": "vitest --ui"`.
- `tsconfig.app.json`: add `"vitest/globals"` to `types`. Do **not** widen `include` — leave tests outside app build via a separate `tsconfig.test.json` only if TS complains; Vitest transpiles tests itself.

## Phase 1 — Utility tests

### 1a. `src/utils/validators.test.ts`
Parameterize with `describe.each` over field types. Per type, assert:
- valid → `undefined`
- invalid → correct default message (see `buildSchema` in `src/utils/validators.ts:38-173`)
- `required: true` + empty → required message (type-specific: `"This field is required"`, `"Please make a selection."`, `"Please select at least one option."`, `"This field is required."`)
- `required: false` + empty → `undefined` (except `Boolean` which always enforces the enum)
- `validationMessage` override replaces default; whitespace-only override falls back to Zod message (line 17 `validationMessage?.trim()`)

Type edges locked against current source:
- **Email**: `"a@b"` invalid, `"a@b.co"` valid (zod v4 `z.email()`)
- **Phone** (`PHONE_REGEX` line 20): 6-char fail, 7-char pass, 20-char pass, 21-char fail; allowed `+`, spaces, `-`, `.`, `()`
- **URL**: `"example.com"` fails, `"https://x.com"` passes
- **Integer / Score**: `"1.5"` fails, `"1"` / `"-3"` pass
- **Float / Currency**: `"1.5"` / `"-1"` pass, `"abc"` fails
- **Percent**: `-1` fail, `0` / `100` pass, `101` fail, `"5.5"` fails (integer-only via `isInteger`, line 104)
- **Range**: any numeric string passes; non-numeric fails
- **Date**: `"2024-02-30"` **passes** (regex-only, line 31 — lock current behavior with a comment); `"2024/02/02"` fails; `"2024-02-02"` passes
- **DateTime**: `"not a date"` fails; `"2024-01-01T00:00:00Z"` passes
- **Boolean**: only `"true"`/`"false"` pass; everything else fails with `"Select a valid option."`
- **Select / Radio**: required empty → `"Please make a selection."`
- **Checkbox**: required empty → `"Please select at least one option."`
- **SingleCheckbox**: required empty → `"This field is required."`
- **HtmlText / Hidden**: any string passes

### 1b. `src/utils/visibilityRules.test.ts`
Cover `resolveFieldVisibility` and `hasOptionValue` (`src/utils/visibilityRules.ts`).

`resolveFieldVisibility`:
- No `visibilityRule` → `{ field, isVisible: true }` (line 143-145)
- `defaultVisibility: "show"` + no match → visible; + match → hidden (line 148-149 inversion)
- `defaultVisibility: "hide"` + match → visible
- All 6 operators (`equal` / `notEqual` / `contains` / `notContains` / `isEmpty` / `isNotEmpty`) — one positive, one negative case each (lines 78-105)
- Subject = `Select`: rule matches by option **value** and by option **label** (both branches in `getOptionComparableValues` line 40-42)
- Subject = `Checkbox` with `"a,b"`: rule for `"a"` matches, rule for `"c"` doesn't (line 36 split)
- Subject = `SingleCheckbox` with no `option.value` → defaults to `"true"` (line 46)
- `altLabel` on matching rule replaces label; `altLabel === null | undefined` preserves original (line 120)
- `picklistFilterValues` replaces `options` on Select/Checkbox/Radio; replaces `option` on `SingleCheckbox` (line 125-132)
- `normalize()` trims and coerces (whitespace rule values match)

`hasOptionValue`:
- Empty value → `true` (line 158)
- Select/Radio: present → true, absent → false
- Checkbox `"a,b"`: both in options → true; `"a,x"` with missing `x` → false
- SingleCheckbox with `option` → matches value or label
- SingleCheckbox without `option` → only `"true"` is valid (line 174)

### 1c. `src/utils/fetchMarketoForm.test.ts`
Use `vi.stubGlobal('fetch', vi.fn())` with the fixture. Suppress `console.log` (line 188) with `vi.spyOn(console, 'log').mockImplementation(() => {})` in `beforeEach`.

- `fetch` returns `{ ok: false, statusText: '...' }` → throws `"Failed to fetch Marketo form {id}: ..."` (line 183)
- All 18 `MarketoDatatype` values map to correct `FormField.type` (drive via fixture; assert one output field per datatype)
- `checkbox` with >1 option → `Checkbox`; with 1 option → `SingleCheckbox` (line 90-93)
- `picklistValues` entries with `value: ""` filtered out (line 16)
- `VisibilityRule` with empty `rules` array → field has `visibilityRule: undefined` (line 23)
- `defaultVisibility` unrecognized → falls back to `"hide"` (line 29)
- `defaultValues`: non-hidden get `""`; hidden get resolver output

**Hidden-field resolver** (indirect, via `fetchMarketoForm` output since `resolveHiddenFieldValue` is not exported — `src/utils/fetchMarketoForm.ts:143-173`):
- Missing `InputSourceChannel` → `InputInitialValue`
- `"constant"` → `InputInitialValue`
- `"cookie"` / `"cookies"` with selector + matching `document.cookie` → decoded value (set via `Object.defineProperty(document, 'cookie', { writable: true, value: 'name=value' })` before calling `fetchMarketoForm`)
- `"cookie"` with missing selector → `InputInitialValue` (line 161)
- `"cookie"` selector not present → `InputInitialValue`
- `"cookie"` value `"hello%20world"` → `"hello world"` (`safeDecodeURIComponent`)
- `"cookie"` malformed value `"bad%ZZ"` → raw returned (catch branch line 110-113)
- `"url"` matching `window.location.search` → query value (stub via `window.history.pushState({}, '', '?x=y')` before calling)
- `"url"` missing selector → `InputInitialValue`
- `"url"` param absent → `InputInitialValue`
- Unknown channel → `InputInitialValue` (default branch line 170)

### 1d. `src/config/validationMessageOverrides.test.ts`
`resolveValidationMessageOverride` (`src/config/validationMessageOverrides.ts:25`):
- Form-specific hit (form `7471`, field `Email`) wins over global
- Global fallback when no form-specific match
- Returns `undefined` when neither matches
- Whitespace-only entries treated as missing (line 30 uses `?.trim()`, falsy `""` falls through)

## Phase 2 — Component tests

### 2a. `src/components/FieldLayout.test.tsx`
- Renders `label` only when truthy (`src/components/FieldLayout.tsx:13-15`)
- Error `<p>` renders **only** when `isTouched && error` — all four combinations (line 17-19)
- Children always render

### 2b. Field-type components
Write one consolidated suite **per natural group** (not 20 files — keep it maintainable). Organize by behavioral similarity:

1. `text-inputs.test.tsx` — Text, TextArea, Email, Phone, URL, Integer, Float, Currency, Percent, Score (all share the same input shape)
2. `date-inputs.test.tsx` — Date, DateTime (assert `type="date"` / `type="datetime-local"`)
3. `choice-inputs.test.tsx` — Select, Radio, Checkbox, SingleCheckbox, Boolean
4. `special.test.tsx` — Range, HtmlText, Hidden

Shared pattern per test via `renderField(field)`:
- Correct `name` attr + input element type
- `user.type()` / `user.click()` updates form value (read via returned form API)
- Blur sets `isTouched` → invalid value shows error; valid → no error

Group-specific must-haves:
- **Checkbox**: toggling maintains comma-separated value; untoggling removes the value
- **SingleCheckbox**: uses `option.label` with `dangerouslySetInnerHTML` when `option` provided; falls back to `label` otherwise (`src/components/field-types/SingleCheckbox.tsx:26`); missing `option.value` stores `"true"` (line 27)
- **Boolean**: `<select>` with exactly two options `"true"` / `"false"`
- **Range**: `min`/`max` attrs; display span mirrors `field.state.value`
- **HtmlText**: renders HTML via `dangerouslySetInnerHTML`; no input element
- **Hidden**: `type="hidden"`, not visually rendered, value passes through

### 2c. `src/components/FormFields.test.tsx` — integration
Render `FormFields` inside a real `useForm` harness with a multi-field `fields` array.

- Field with no `visibilityRule` always renders
- Field with rule pointing at subject — type into subject → target appears/disappears (line 60 `resolveFieldVisibility`)
- Hiding a field with a prior value → `useEffect` clears it (line 67-75) — set value, make invisible, assert form value is `""`
- Select whose rule applies `picklistFilterValues` — rendered `<option>` list changes after the rule matches
- `altLabel` updates visible label text after rule matches
- `hasOptionValue` clears stale selection when filtered options no longer include current value
- Switch statement routes each `type` → correct component: render fixture with one of each and assert presence by input `type`/`role`

## Critical files

**New:**
- `vitest.config.ts`
- `src/test/setup.ts`, `src/test/helpers.tsx`, `src/test/fixtures/marketoForm.ts`
- `src/utils/validators.test.ts`
- `src/utils/visibilityRules.test.ts`
- `src/utils/fetchMarketoForm.test.ts`
- `src/config/validationMessageOverrides.test.ts`
- `src/components/FieldLayout.test.tsx`
- `src/components/FormFields.test.tsx`
- `src/components/field-types/text-inputs.test.tsx`
- `src/components/field-types/date-inputs.test.tsx`
- `src/components/field-types/choice-inputs.test.tsx`
- `src/components/field-types/special.test.tsx`

**Modified:**
- `package.json` — scripts + dev deps
- `tsconfig.app.json` — `types: ["vite/client", "vitest/globals"]`

**Read-only (under test):**
- `src/utils/validators.ts`, `src/utils/visibilityRules.ts`, `src/utils/fetchMarketoForm.ts`
- `src/config/validationMessageOverrides.ts`
- `src/components/FormFields.tsx`, `src/components/FieldLayout.tsx`
- `src/components/field-types/*.tsx`

## Reusable patterns

- **One TanStack harness** (`renderField`) for all component tests — no per-test form wiring.
- **`it.each` / `describe.each`** for validators and visibility operators — collapses ~40 assertions into a few tables.
- **Single fixture module** (`src/test/fixtures/marketoForm.ts`) — no inline JSON in tests; `makeHiddenField(overrides)` for resolver cases.
- Import `resolveFieldVisibility` / `hasOptionValue` directly in `FormFields.test.tsx` setup to assert invariants without duplicating logic.

## Verification

After each phase:
1. `pnpm test:run` — full suite green
2. `pnpm lint` — no regressions
3. `pnpm build` — TS still compiles (guards the `tsconfig.app.json` change)
4. Add `@vitest/coverage-v8` and run `pnpm test:run -- --coverage`: `src/utils/*` ≥ 95%, `src/components/*` ≥ 80%
5. **Mutation spot-check:** temporarily break Percent upper bound (change `n <= 100` to `n <= 1000`) — confirm a test fails. Revert.
6. **Mutation spot-check:** temporarily remove the cookie fallback in `resolveHiddenFieldValue` — confirm hidden-field tests fail. Revert.

Stop condition: validators, visibility rules, and hidden-field resolution have green coverage for every documented branch, and each field-type component has at minimum render + validation-error tests.