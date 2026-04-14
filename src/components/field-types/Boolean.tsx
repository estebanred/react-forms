import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type BooleanProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  required?: boolean;
  type: Extract<FormField, { type: "Boolean" }>["type"];
};

function Boolean({ form, label, name, required, type }: BooleanProps) {
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
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default Boolean;
