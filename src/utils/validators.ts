import { z } from "zod";
import type { FormField } from "../types/FormData";

type FormFieldValidator = {
  onChange: ({ value }: { value: string }) => string | undefined;
};

const formFieldSchemas = {
  Text: z.string().trim(),
  Email: z.email("Enter a valid email address."),
  TextArea: z.string().trim(),
} satisfies Record<FormField["type"], z.ZodType<string, string>>;

const validateWithSchema =
  (schema: z.ZodType<string, string>) =>
  ({ value }: { value: string }) => {
    const result = schema.safeParse(value);

    return result.success ? undefined : result.error.issues[0]?.message;
  };

export const formFieldValidators: Record<
  FormField["type"],
  FormFieldValidator
> = {
  Text: {
    onChange: validateWithSchema(formFieldSchemas.Text),
  },
  Email: {
    onChange: validateWithSchema(formFieldSchemas.Email),
  },
  TextArea: {
    onChange: validateWithSchema(formFieldSchemas.TextArea),
  },
};
