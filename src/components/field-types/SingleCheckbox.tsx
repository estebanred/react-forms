import { memo } from "react";
import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type SingleCheckboxProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  option?: Extract<FormField, { type: "SingleCheckbox" }>["option"];
  required?: boolean;
  type: Extract<FormField, { type: "SingleCheckbox" }>["type"];
};

function SingleCheckbox({
  form,
  label,
  name,
  option,
  required,
  type,
}: SingleCheckboxProps) {
  const checkboxLabel = option?.label ?? label;
  const checkedValue = option?.value ?? "true";

  return (
    <form.Field name={name} validators={getFieldValidator({ type, required })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={option ? label : ""}
        >
          <div className="flex items-center gap-3 cursor-pointer">
            <input
              className="accent-cyan-400"
              type="checkbox"
              name={field.name}
              checked={field.state.value === checkedValue}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(event.target.checked ? checkedValue : "")
              }
            />
            <span
              className="text-sm text-white"
              dangerouslySetInnerHTML={{ __html: checkboxLabel }}
            />
          </div>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default memo(SingleCheckbox);
