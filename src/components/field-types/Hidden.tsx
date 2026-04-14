import { getFieldValidator } from "../../utils/validators";
import type { FormField } from "../../types/FormData";
import type { FormApi } from "../../types/types";

type HiddenProps = {
  form: FormApi;
  name: FormField["name"];
  type: Extract<FormField, { type: "Hidden" }>["type"];
};

function Hidden({ form, name, type }: HiddenProps) {
  return (
    <form.Field name={name} validators={getFieldValidator({ type, required: false })}>
      {(field) => (
        <input
          name={field.name}
          type="hidden"
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </form.Field>
  );
}

export default Hidden;
