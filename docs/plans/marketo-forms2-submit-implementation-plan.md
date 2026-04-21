# Wire Marketo Forms 2.0 Submission into `App.tsx`

## Context

Today `src/App.tsx` loads Marketo form metadata via `fetchMarketoForm.ts` (REST `getForm`) and renders a fully custom TanStack-Form UI. The `onSubmit` handler is a stub — it stores the value in local React state and never talks to Marketo, so no lead is captured and no tracking occurs.

The goal is to keep everything about field loading and custom rendering exactly as-is, but have the Send Message button perform a real submission through the **Marketo Forms 2.0 JavaScript API** (`MktoForms2.loadForm` → `setValues` → `submit`). Forms 2.0 is the supported path for lead capture + Munchkin association; posting directly to `/save2` is deprecated per Adobe docs.

## Approach

Load `forms2.min.js` dynamically, call `MktoForms2.loadForm` against a hidden `<form id="mktoForm_${FORM_ID}">` placeholder, and expose a promise-wrapped `submit(values)` function that the existing TanStack `onSubmit` awaits. The React form stays the single source of truth for UI + validation; Marketo's injected DOM is hidden and used only as the transport layer.

### Key design decisions

- **Script loading:** dynamic injection inside a hook with a module-level cached promise (single `<script>` across remounts and Strict Mode). Keeps `index.html` clean and avoids loading Marketo on routes that don't need it.
- **Hook split:** `useMarketoFormsScript` (just the `<script>`) + `useMarketoForm` (composes the script hook, calls `loadForm`, returns a `submit` function and a readiness status).
- **Placeholder element:** render `<form id="mktoForm_${FORM_ID}" style={{ display: "none" }} aria-hidden="true" />` as a sibling of the React `<form>` inside `FormContainer`. Inline `display:none` (not Tailwind `hidden`) so it can't be purged; `key={\`mkto-${formId}\`}` so a form-ID change forces a clean remount.
- **Submit bridge:** wrap `mkto.submit()` in a Promise that resolves inside `onSuccess` (returning `false` to suppress Marketo's redirect) and rejects on a 15s timeout. TanStack Form's `onSubmit` awaits this, so `isSubmitting` reflects the real network round-trip.
- **Base URL:** pass `VITE_MARKETO_URL` (absolute origin, e.g. `https://marketing.boomi.com`) to both the script src and `loadForm` — NOT the `/marketo-api` Vite proxy, since Forms 2.0 issues cross-origin calls from the browser itself.
- **Button gating:** disable the submit button while `marketo.status !== "ready"` or while `isSubmitting`, with a "Preparing…" label during script load.

## Files

### Create

- **`src/types/MarketoForms2.ts`** — minimal ambient declarations for `window.MktoForms2` and the `MktoForm` instance. Only the methods we use: `setValues`, `vals`, `addHiddenFields`, `submit`, `submittable`, `onSubmit`, `onSuccess`, `onValidate`, `getId`. Types `FormValues` from `src/types/FormData.ts` so values stay `Record<string, string>`.

- **`src/hooks/useMarketoFormsScript.ts`** — injects `${marketoOrigin}/js/forms2/js/forms2.min.js` once (module-level `Promise<void>` singleton keyed by origin). Returns `{ status: "idle" | "loading" | "ready" | "error", error }`.

- **`src/hooks/useMarketoForm.ts`** — depends on the script hook. Once script is ready AND `enabled === true` (placeholder mounted), calls `MktoForms2.loadForm(marketoOrigin, munchkinId, formId, form => …)`. Stores the `MktoForm` in a ref. Exposes:
  ```ts
  {
    status: "idle" | "loading" | "ready" | "error",
    error: Error | null,
    submit: (values: FormValues) => Promise<void>,
  }
  ```
  `submit` attaches a fresh `onSuccess` handler per call, calls `setValues(values)` then `submit()`, and resolves/rejects via that handler with a 15s timeout guard.

### Modify

- **`src/App.tsx`**
  - Import `useMarketoForm` and call it inside `FormContainer` with `VITE_MARKETO_URL`, `VITE_MUNCHKIN_ID`, `VITE_FORM_ID`.
  - Add a new env constant `MARKETO_URL = import.meta.env.VITE_MARKETO_URL` alongside the existing ones.
  - Add the hidden placeholder `<form id={\`mktoForm_${FORM_ID}\`} style={{ display: "none" }} aria-hidden="true" />` inside the `<section>` (outside the React `<form>` to avoid nested-form DOM).
  - Change `onSubmit` from `setSubmittedValue(value)` to:
    ```ts
    await marketo.submit(value);
    setSubmittedValue(value);
    ```
  - Extend the submit button's `<form.Subscribe>` to also depend on `marketo.status` and show "Preparing…" while not ready, "Submitting…" during submission.
  - Render a small error banner when `marketo.status === "error"`.

### Do NOT touch

- `src/utils/fetchMarketoForm.ts` — field loading stays identical.
- `src/components/FormFields.tsx` and its children.
- `src/types/FormData.ts`, `src/types/MarketoFormResponse.ts`.
- `src/config/validationMessageOverrides.ts`.
- `index.html`, `vite.config.ts`, `.env`.

## Risks to verify early

1. **Marketo's internal validation on a hidden form.** Forms 2.0 runs its own validation against its injected inputs; if required fields are empty in the hidden DOM, `submit()` will silently refuse. Mitigation if this happens: call `mkto.addHiddenFields(values)` in addition to `setValues(values)` so values land on actual `<input type="hidden">` elements that Marketo's validator treats as filled, and/or call `mkto.submittable(true)` immediately before `submit()`. Confirm by checking DevTools Network for a POST to `/index.php/leadCapture/save2` after pressing Send Message.
2. **Strict Mode double-loading.** `loadForm` can be called twice in dev. The module-level script promise handles the script side; for `loadForm`, guard with a ref so it only runs once per `(munchkinId, formId)` pair.
3. **No CORS/CSP surprise.** `forms2.min.js` transitively loads `munchkin.js` and POSTs to `*.mktoresp.com`. If a CSP is ever added later, it'll need `script-src https://marketing.boomi.com` and `connect-src *.mktoresp.com https://marketing.boomi.com`. Not a blocker today (no CSP in `index.html`), but worth noting.

## Verification

1. **Dev run:** `pnpm dev`, open the form, fill required fields, press Send Message.
2. **Network tab:** confirm a successful POST to `https://marketing.boomi.com/index.php/leadCapture/save2` with form data in the body (the Forms 2.0 script will issue this).
3. **Marketo Admin:** confirm the lead appears in the target Marketo instance for form ID `7205` within ~30 seconds.
4. **Tracking cookie:** confirm `_mkto_trk` cookie is present on `marketing.boomi.com` after first visit (set by Munchkin which `forms2.min.js` pulls in).
5. **UX states:**
   - Reload with DevTools "Slow 3G" throttling — submit button should say "Preparing…" and be disabled until the script loads.
   - Block `marketing.boomi.com/js/forms2/js/forms2.min.js` with DevTools request-blocking — error banner should appear; button stays disabled.
   - Submit while the backend is blocked — after 15s the TanStack submit promise should reject and the button should become enabled again.
6. **Strict Mode:** check browser console for duplicate `MktoForms2.loadForm` warnings; there should be none on re-mount.
