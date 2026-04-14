import { getFieldValidator } from "../../utils/validators";
import FieldLayout from "../FieldLayout";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type SingleCheckboxProps = {
  form: FormApi;
  label: string;
  name: FormField["name"];
  required?: boolean;
  type: Extract<FormField, { type: "SingleCheckbox" }>["type"];
};

function SingleCheckbox({ form, label, name, required, type }: SingleCheckboxProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required })}>
      {(field) => (
        <FieldLayout
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label={label}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              className="accent-cyan-400"
              type="checkbox"
              name={field.name}
              checked={field.state.value === "true"}
              onBlur={field.handleBlur}
              onChange={(event) =>
                field.handleChange(event.target.checked ? "true" : "false")
              }
            />
            <span className="text-sm text-white">{label}</span>
          </label>
        </FieldLayout>
      )}
    </form.Field>
  );
}

export default SingleCheckbox;
