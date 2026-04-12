import { formFieldValidators } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormApi, FormField } from "../../types/types";

type TextAreaProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  placeholder?: string;
  type: Extract<FormField, { type: "TextArea" }>["type"];
};

function TextArea({ form, label, name, placeholder, type }: TextAreaProps) {
  return (
    <form.Field name={name} validators={formFieldValidators[type]}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
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

export default TextArea;
