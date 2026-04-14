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

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

function isNumeric(v: string) {
  return v.trim() === "" || !isNaN(Number(v.trim()));
}

function isInteger(v: string) {
  return v.trim() === "" || Number.isInteger(Number(v.trim()));
}

function isISODate(v: string) {
  return v.trim() === "" || /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
}

function isISODateTime(v: string) {
  return v.trim() === "" || !isNaN(Date.parse(v.trim()));
}

function buildSchema(
  field: Pick<FormField, "type" | "required">,
): z.ZodType<string, string> {
  const required = field.required ?? false;

  switch (field.type) {
    // --- Text-based ---
    case "Text":
    case "TextArea": {
      const base = z.string().trim();
      return required ? base.min(1, "This field is required") : base;
    }

    case "Email": {
      return required
        ? z
            .email("Enter a valid email address.")
            .min(1, "This field is required")
        : z.email("Enter a valid email address.");
    }

    case "Phone": {
      const base = z
        .string()
        .trim()
        .regex(PHONE_REGEX, "Enter a valid phone number.");
      return required
        ? z
            .string()
            .trim()
            .min(1, "This field is required")
            .regex(PHONE_REGEX, "Enter a valid phone number.")
        : base;
    }

    case "URL": {
      return required
        ? z.url("Enter a valid URL.").trim().min(1, "This field is required")
        : z.url("Enter a valid URL.").trim();
    }

    // --- Numeric ---
    case "Integer":
    case "Score": {
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(isInteger, "Enter a valid whole number.")
        : z.string().refine(isInteger, "Enter a valid whole number.");
    }

    case "Float":
    case "Currency": {
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(isNumeric, "Enter a valid number.")
        : z.string().refine(isNumeric, "Enter a valid number.");
    }

    case "Percent": {
      const inRange = (v: string) => {
        if (v.trim() === "") return true;
        const n = Number(v.trim());
        return isInteger(v) && n >= 0 && n <= 100;
      };
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(inRange, "Enter a percentage between 0 and 100.")
        : z.string().refine(inRange, "Enter a percentage between 0 and 100.");
    }

    case "Range": {
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(isNumeric, "Enter a valid number.")
        : z.string().refine(isNumeric, "Enter a valid number.");
    }

    // --- Date / Time ---
    case "Date": {
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(isISODate, "Enter a valid date (YYYY-MM-DD).")
        : z.string().refine(isISODate, "Enter a valid date (YYYY-MM-DD).");
    }

    case "DateTime": {
      return required
        ? z
            .string()
            .min(1, "This field is required")
            .refine(isISODateTime, "Enter a valid date and time.")
        : z.string().refine(isISODateTime, "Enter a valid date and time.");
    }

    // --- Boolean / Checkbox ---
    case "Boolean": {
      return z.enum(["true", "false"], { error: "Select a valid option." });
    }

    case "SingleCheckbox": {
      return required
        ? z.string().min(1, "This field is required.")
        : z.string();
    }

    // --- Selection ---
    case "Select":
    case "Radio": {
      const base = z.string().trim();
      return required ? base.min(1, "Please make a selection.") : base;
    }

    case "Checkbox": {
      const base = z.string().trim();
      return required
        ? base.min(1, "Please select at least one option.")
        : base;
    }

    // --- Display / Hidden (no meaningful validation) ---
    case "HtmlText":
    case "Hidden": {
      return z.string();
    }
  }
}

export function getFieldValidator(
  field: Pick<FormField, "type" | "required">,
): FormFieldValidator {
  return { onChange: validateWithSchema(buildSchema(field)) };
}
