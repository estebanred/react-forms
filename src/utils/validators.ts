import type { FormField } from "../types/FormData";

type FormFieldValidator = {
  onChange: ({ value }: { value: string }) => string | undefined;
};

export const formFieldValidators: Record<
  FormField["type"],
  FormFieldValidator
> = {
  Text: {
    onChange: ({ value }: { value: string }) =>
      value.trim().length < 2 ? "Enter at least 2 characters." : undefined,
  },
  Email: {
    onChange: ({ value }: { value: string }) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? undefined
        : "Enter a valid email address.",
  },
  TextArea: {
    onChange: ({ value }: { value: string }) =>
      value.trim().length < 10
        ? "Add a short message with at least 10 characters."
        : undefined,
  },
};
