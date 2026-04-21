import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type DateTimeProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  required?: boolean;
  validationMessage?: FormField["validationMessage"];
  type: Extract<FormField, { type: "DateTime" }>["type"];
};

function DateTime({ form, label, name, required, validationMessage, type }: DateTimeProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required, validationMessage })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
          required={required}
        >
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            type="datetime-local"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default memo(DateTime);
