import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketoForm } from "./utils/fetchMarketoForm";
import type { MarketoFormData } from "./utils/fetchMarketoForm";
import FormFields from "./components/FormFields";
import type { FormValues } from "./types/FormData";

// ── Marketo form config ──────────────────────────────────────────────────────
const MARKETO_BASE_URL = "";
const MUNCHKIN_ID = "";
const FORM_ID = 0;

// ────────────────────────────────────────────────────────────────────────────

function FormContainer({ fields, defaultValues }: MarketoFormData) {
  const [submittedValue, setSubmittedValue] = useState<FormValues | null>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setSubmittedValue(value);
    },
  });

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-12 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur sm:p-10">
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FormFields form={form} fields={fields} />

            <div className="flex flex-wrap items-center gap-3">
              <form.Subscribe
                selector={(state) =>
                  [state.canSubmit, state.isSubmitting] as const
                }
              >
                {([canSubmit, isSubmitting]) => (
                  <button
                    className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-300"
                    type="submit"
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? "Submitting..." : "Send message"}
                  </button>
                )}
              </form.Subscribe>

              <button
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-stone-200 transition hover:border-white/30 hover:bg-white/5"
                type="button"
                onClick={() => {
                  form.reset();
                  setSubmittedValue(null);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6 rounded-3xl border border-white/10 bg-linear-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 p-8 sm:p-10">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Live form state
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              TanStack Form keeps field values, validation, and submit state in
              sync without separate local handlers for each input.
            </p>
          </div>

          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-cyan-100">
                {JSON.stringify(values, null, 2)}
              </pre>
            )}
          </form.Subscribe>

          <div>
            <h2 className="text-lg font-semibold text-white">Last submit</h2>
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-emerald-100">
              {JSON.stringify(submittedValue, null, 2)}
            </pre>
          </div>
        </aside>
      </div>
    </main>
  );
}

function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketoForm", MUNCHKIN_ID, FORM_ID],
    queryFn: () => fetchMarketoForm(MARKETO_BASE_URL, MUNCHKIN_ID, FORM_ID),
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-300">
        Loading form…
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 text-red-400">
        Failed to load form:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </main>
    );
  }

  return (
    <FormContainer fields={data.fields} defaultValues={data.defaultValues} />
  );
}

export default App;
