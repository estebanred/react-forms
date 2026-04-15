import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type SelectProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  type: Extract<FormField, { type: "Select" }>["type"];
};

function Select({ form, label, name, options, required, type }: SelectProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
        >
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          >
            <option value="">Select…</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default memo(Select);
