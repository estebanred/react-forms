import { contactFormValidators } from "../utils/validation";
import InputField from "./input-field";
import type { ContactFormApi } from "./types";

type FullNameFieldProps = {
  form: ContactFormApi;
};

function FullNameField({ form }: FullNameFieldProps) {
  return (
    <form.Field
      name="fullName"
      validators={contactFormValidators.fullName}
    >
      {(field) => (
        <InputField
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label="Full name"
        >
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="Ada Lovelace"
          />
        </InputField>
      )}
    </form.Field>
  );
}

export default FullNameField;
