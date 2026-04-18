import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveValidationMessageOverride,
  validationMessageOverrides,
} from "./validationMessageOverrides";

type GlobalOverrides = NonNullable<typeof validationMessageOverrides.global>;
type FormOverrides = NonNullable<typeof validationMessageOverrides.byFormId>;

const originalGlobal: GlobalOverrides = {
  ...(validationMessageOverrides.global ?? {}),
};
const originalByFormId = cloneByFormId(
  validationMessageOverrides.byFormId ?? {},
);

function cloneByFormId(source: FormOverrides): FormOverrides {
  const clone: FormOverrides = {};

  for (const [formId, overrides] of Object.entries(source)) {
    clone[Number(formId)] = { ...overrides };
  }

  return clone;
}

function restoreOriginalOverrides() {
  validationMessageOverrides.global = { ...originalGlobal };
  validationMessageOverrides.byFormId = cloneByFormId(originalByFormId);
}

describe("resolveValidationMessageOverride", () => {
  beforeEach(() => {
    restoreOriginalOverrides();
  });

  afterEach(() => {
    restoreOriginalOverrides();
  });

  it("prefers form-specific overrides over global overrides", () => {
    validationMessageOverrides.global = {
      Email: "Global email message.",
    };
    validationMessageOverrides.byFormId = {
      7471: {
        Email: "Form-specific email message.",
      },
    };

    expect(resolveValidationMessageOverride("Email", 7471)).toBe(
      "Form-specific email message.",
    );
  });

  it("falls back to a global override when no form-specific override matches", () => {
    validationMessageOverrides.global = {
      Email: "Global email message.",
    };
    validationMessageOverrides.byFormId = {
      7471: {
        Phone: "Form-specific phone message.",
      },
    };

    expect(resolveValidationMessageOverride("Email", 7471)).toBe(
      "Global email message.",
    );
  });

  it("returns undefined when neither form-specific nor global overrides match", () => {
    validationMessageOverrides.global = {};
    validationMessageOverrides.byFormId = {};

    expect(resolveValidationMessageOverride("Email", 7471)).toBeUndefined();
  });

  it("treats whitespace-only overrides as missing", () => {
    validationMessageOverrides.global = {
      Email: "Global email message.",
      Phone: "   ",
    };
    validationMessageOverrides.byFormId = {
      7471: {
        Email: " \n ",
      },
    };

    expect(resolveValidationMessageOverride("Email", 7471)).toBe(
      "Global email message.",
    );
    expect(resolveValidationMessageOverride("Phone", 7471)).toBeUndefined();
  });
});
