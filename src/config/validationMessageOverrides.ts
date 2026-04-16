type ValidationMessageOverrideMap = Record<string, string>;

type ValidationMessageOverrides = {
  global?: ValidationMessageOverrideMap;
  byFormId?: Record<number, ValidationMessageOverrideMap>;
};

export const validationMessageOverrides: ValidationMessageOverrides = {
  global: {
    // Example:
    // Email: "Please use your work email address.",
  },
  byFormId: {
    // Example:
    // 1234: {
    //   Email: "Please use your company email for this form.",
    // },
    7471: {
      Email: "Please use your company email for this form.",
      Phone: "Please use a valid phone number.",
    },
  },
};

export function resolveValidationMessageOverride(
  fieldName: string,
  formId: number,
): string | undefined {
  const formSpecific =
    validationMessageOverrides.byFormId?.[formId]?.[fieldName]?.trim();
  if (formSpecific) {
    return formSpecific;
  }

  const global = validationMessageOverrides.global?.[fieldName]?.trim();
  if (global) {
    return global;
  }

  return undefined;
}
