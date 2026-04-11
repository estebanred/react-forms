import type { FormFieldName } from "../form-fields/types";

type FormFieldValidator = {
  onChange: ({ value }: { value: string }) => string | undefined;
};

export const formFieldValidators: Record<FormFieldName, FormFieldValidator> = {
  fullName: {
    onChange: ({ value }: { value: string }) =>
      value.trim().length < 2 ? "Enter at least 2 characters." : undefined,
  },
  email: {
    onChange: ({ value }: { value: string }) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? undefined
        : "Enter a valid email address.",
  },
  message: {
    onChange: ({ value }: { value: string }) =>
      value.trim().length < 10
        ? "Add a short message with at least 10 characters."
        : undefined,
  },
};
