import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type RadioProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  validationMessage?: FormField["validationMessage"];
  type: Extract<FormField, { type: "Radio" }>["type"];
};

function Radio({ form, label, name, options, required, validationMessage, type }: RadioProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required, validationMessage })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
        >
          <div className="space-y-2">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  className="accent-cyan-400"
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  checked={field.state.value === opt.value}
                  onBlur={field.handleBlur}
                  onChange={() => field.handleChange(opt.value)}
                />
                <span className="text-sm text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default memo(Radio);
