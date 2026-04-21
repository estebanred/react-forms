import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type TextAreaProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  placeholder?: string;
  required?: boolean;
  validationMessage?: FormField["validationMessage"];
  type: Extract<FormField, { type: "TextArea" }>["type"];
};

function TextArea({ form, label, name, placeholder, required, validationMessage, type }: TextAreaProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required, validationMessage })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
          required={required}
        >
          <textarea
            className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
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

export default memo(TextArea);
