import { contactFormValidators } from "../utils/validation";
import InputField from "./input-field";
import type { ContactFormApi } from "./types";

type EmailFieldProps = {
  form: ContactFormApi;
};

function EmailField({ form }: EmailFieldProps) {
  return (
    <form.Field name="email" validators={contactFormValidators.email}>
      {(field) => (
        <InputField
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label="Email"
        >
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            type="email"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="ada@analytical.engine"
          />
        </InputField>
      )}
    </form.Field>
  );
}

export default EmailField;
