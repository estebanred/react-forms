import { contactFormValidators } from "../utils/validation";
import InputField from "./input-field";
import type { ContactFormApi } from "./types";

type MessageFieldProps = {
  form: ContactFormApi;
};

function MessageField({ form }: MessageFieldProps) {
  return (
    <form.Field name="message" validators={contactFormValidators.message}>
      {(field) => (
        <InputField
          error={field.state.meta.errors[0]}
          isTouched={field.state.meta.isTouched}
          label="Message"
        >
          <textarea
            className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            placeholder="Tell us what you want to build with TanStack Form."
          />
        </InputField>
      )}
    </form.Field>
  );
}

export default MessageField;
