import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type RangeProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  min?: number;
  max?: number;
  required?: boolean;
  validationMessage?: FormField["validationMessage"];
  type: Extract<FormField, { type: "Range" }>["type"];
};

function Range({ form, label, name, min, max, required, validationMessage, type }: RangeProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required, validationMessage })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
        >
          <div className="flex items-center gap-4">
            <input
              className="w-full accent-cyan-400"
              name={field.name}
              type="range"
              min={min}
              max={max}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <span className="min-w-[3rem] text-right text-sm text-white">
              {field.state.value}
            </span>
          </div>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default memo(Range);
