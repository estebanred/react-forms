export type ContactFormData = {
  fullName: string;
  email: string;
  message: string;
};

export const contactFormDefaultValues = {
  fullName: "",
  email: "",
  message: "",
} satisfies ContactFormData;

export const contactFormValidators = {
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
} as const;
