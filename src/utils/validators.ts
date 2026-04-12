import { z } from "zod";
import type { FormField } from "../types/FormData";

type FormFieldValidator = {
  onChange: ({ value }: { value: string }) => string | undefined;
};

const validateWithSchema =
  (schema: z.ZodType<string, string>) =>
  ({ value }: { value: string }) => {
    const result = schema.safeParse(value);

    return result.success ? undefined : result.error.issues[0]?.message;
  };

function buildSchema(
  field: Pick<FormField, "type" | "required">,
): z.ZodType<string, string> {
  const required = field.required ?? false;

  switch (field.type) {
    case "Text": {
      const base = z.string().trim();
      return required ? base.min(1, "This field is required") : base;
    }
    case "TextArea": {
      const base = z.string().trim();
      return required ? base.min(1, "This field is required") : base;
    }
    case "Email": {
      const base = z.email("Enter a valid email address.");
      return required ? base : z.email("Enter a valid email address.");
    }
  }
}

export function getFieldValidator(
  field: Pick<FormField, "type" | "required">,
): FormFieldValidator {
  return { onChange: validateWithSchema(buildSchema(field)) };
}
