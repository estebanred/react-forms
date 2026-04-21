import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type CheckboxProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  validationMessage?: FormField["validationMessage"];
  type: Extract<FormField, { type: "Checkbox" }>["type"];
};

function Checkbox({ form, label, name, options, required, validationMessage, type }: CheckboxProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required, validationMessage })}>
      {(field) => {
        const selected = field.state.value ? field.state.value.split(",").filter(Boolean) : [];

        function toggle(value: string) {
          const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
          field.handleChange(next.join(","));
        }

        return (
          <FieldLayout
            error={field.state.meta.errors[0]}
            isTouched={field.state.meta.isTouched}
            label={label}
            required={required}
          >
            <div className="space-y-2">
              {options.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    className="accent-cyan-400"
                    type="checkbox"
                    name={field.name}
                    value={opt.value}
                    checked={selected.includes(opt.value)}
                    onBlur={field.handleBlur}
                    onChange={() => toggle(opt.value)}
                  />
                  <span className="text-sm text-white">{opt.label}</span>
                </label>
              ))}
            </div>
          </FieldLayout>
        );
      }}
    </form.Field>
  );
}

export default memo(Checkbox);
