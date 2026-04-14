import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type FloatProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  placeholder?: string;
  required?: boolean;
  type: Extract<FormField, { type: "Float" }>["type"];
};

function Float({ form, label, name, placeholder, required, type }: FloatProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
        >
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            type="number"
            step="any"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder={placeholder}
          />
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default Float;
