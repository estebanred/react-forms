import { describe, expect, it } from "vitest";
import { getFieldValidator } from "./validators";
import type { FormField } from "../types/FormData";

type ValidatorField = Pick<FormField, "type" | "required" | "validationMessage">;

type FieldCase = {
  type: FormField["type"];
  validValue: string;
  invalidValue?: string;
  invalidMessage?: string;
  requiredEmptyMessage?: string;
  optionalEmptyMessage?: string;
};

const fieldCases: FieldCase[] = [
  { type: "Text", validValue: "hello", requiredEmptyMessage: "This field is required" },
  {
    type: "TextArea",
    validValue: "hello\nworld",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Email",
    validValue: "person@example.com",
    invalidValue: "not-an-email",
    invalidMessage: "Enter a valid email address.",
    requiredEmptyMessage: "Enter a valid email address.",
    optionalEmptyMessage: "Enter a valid email address.",
  },
  {
    type: "Phone",
    validValue: "+1 (555) 123-4567",
    invalidValue: "abcdefg",
    invalidMessage: "Enter a valid phone number.",
    requiredEmptyMessage: "This field is required",
    optionalEmptyMessage: "Enter a valid phone number.",
  },
  {
    type: "URL",
    validValue: "https://x.com",
    invalidValue: "example.com",
    invalidMessage: "Enter a valid URL.",
    requiredEmptyMessage: "Enter a valid URL.",
    optionalEmptyMessage: "Enter a valid URL.",
  },
  {
    type: "Integer",
    validValue: "-3",
    invalidValue: "1.5",
    invalidMessage: "Enter a valid whole number.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Score",
    validValue: "1",
    invalidValue: "1.5",
    invalidMessage: "Enter a valid whole number.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Float",
    validValue: "1.5",
    invalidValue: "abc",
    invalidMessage: "Enter a valid number.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Currency",
    validValue: "-1",
    invalidValue: "abc",
    invalidMessage: "Enter a valid number.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Percent",
    validValue: "100",
    invalidValue: "101",
    invalidMessage: "Enter a percentage between 0 and 100.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Range",
    validValue: "42.5",
    invalidValue: "abc",
    invalidMessage: "Enter a valid number.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Date",
    validValue: "2024-02-02",
    invalidValue: "2024/02/02",
    invalidMessage: "Enter a valid date (YYYY-MM-DD).",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "DateTime",
    validValue: "2024-01-01T00:00:00Z",
    invalidValue: "not a date",
    invalidMessage: "Enter a valid date and time.",
    requiredEmptyMessage: "This field is required",
  },
  {
    type: "Boolean",
    validValue: "true",
    invalidValue: "yes",
    invalidMessage: "Select a valid option.",
    requiredEmptyMessage: "Select a valid option.",
    optionalEmptyMessage: "Select a valid option.",
  },
  {
    type: "Select",
    validValue: "option-a",
    requiredEmptyMessage: "Please make a selection.",
  },
  {
    type: "Radio",
    validValue: "option-a",
    requiredEmptyMessage: "Please make a selection.",
  },
  {
    type: "Checkbox",
    validValue: "option-a,option-b",
    requiredEmptyMessage: "Please select at least one option.",
  },
  {
    type: "SingleCheckbox",
    validValue: "true",
    requiredEmptyMessage: "This field is required.",
  },
  { type: "HtmlText", validValue: "<p>inline html</p>" },
  { type: "Hidden", validValue: "hidden value" },
];

function validate(field: ValidatorField, value: string) {
  const validator = getFieldValidator(field);
  return validator.onChange({ value });
}

describe("getFieldValidator", () => {
  describe.each(fieldCases)("$type", (testCase) => {
    it("returns undefined for valid values", () => {
      expect(validate({ type: testCase.type, required: false }, testCase.validValue)).toBeUndefined();
    });

    if (testCase.invalidValue && testCase.invalidMessage) {
      it("returns the default message for invalid values", () => {
        expect(validate({ type: testCase.type, required: false }, testCase.invalidValue!)).toBe(
          testCase.invalidMessage,
        );
      });
    }

    it("handles empty values when required", () => {
      expect(validate({ type: testCase.type, required: true }, "")).toBe(
        testCase.requiredEmptyMessage,
      );
    });

    it("handles empty values when not required", () => {
      expect(validate({ type: testCase.type, required: false }, "")).toBe(
        testCase.optionalEmptyMessage,
      );
    });
  });

  it("uses validationMessage when provided", () => {
    expect(
      validate(
        {
          type: "Email",
          required: false,
          validationMessage: "Please use a company email.",
        },
        "not-an-email",
      ),
    ).toBe("Please use a company email.");
  });

  it("falls back to zod message when validationMessage is whitespace", () => {
    expect(
      validate(
        {
          type: "Email",
          required: false,
          validationMessage: "   ",
        },
        "not-an-email",
      ),
    ).toBe("Enter a valid email address.");
  });

  it("locks current Date behavior: calendar-invalid but regex-valid dates still pass", () => {
    // Date validation currently checks only YYYY-MM-DD shape, not calendar validity.
    expect(validate({ type: "Date", required: false }, "2024-02-30")).toBeUndefined();
  });

  it.each([
    ["a@b", "Enter a valid email address."],
    ["a@b.co", undefined],
  ])("validates Email edge case %s", (value, expected) => {
    expect(validate({ type: "Email", required: false }, value)).toBe(expected);
  });

  it.each([
    ["123456", "Enter a valid phone number."],
    ["1234567", undefined],
    ["1".repeat(20), undefined],
    ["1".repeat(21), "Enter a valid phone number."],
    ["+1 (555).123-4567", undefined],
  ])("validates Phone edge case %s", (value, expected) => {
    expect(validate({ type: "Phone", required: false }, value)).toBe(expected);
  });

  it.each([
    ["example.com", "Enter a valid URL."],
    ["https://x.com", undefined],
  ])("validates URL edge case %s", (value, expected) => {
    expect(validate({ type: "URL", required: false }, value)).toBe(expected);
  });

  it.each(["Integer", "Score"] as const)("validates %s integer constraints", (type) => {
    expect(validate({ type, required: false }, "1.5")).toBe("Enter a valid whole number.");
    expect(validate({ type, required: false }, "1")).toBeUndefined();
    expect(validate({ type, required: false }, "-3")).toBeUndefined();
  });

  it.each(["Float", "Currency"] as const)("validates %s numeric constraints", (type) => {
    expect(validate({ type, required: false }, "1.5")).toBeUndefined();
    expect(validate({ type, required: false }, "-1")).toBeUndefined();
    expect(validate({ type, required: false }, "abc")).toBe("Enter a valid number.");
  });

  it("validates Percent bounds and integer-only constraint", () => {
    expect(validate({ type: "Percent", required: false }, "-1")).toBe(
      "Enter a percentage between 0 and 100.",
    );
    expect(validate({ type: "Percent", required: false }, "0")).toBeUndefined();
    expect(validate({ type: "Percent", required: false }, "100")).toBeUndefined();
    expect(validate({ type: "Percent", required: false }, "101")).toBe(
      "Enter a percentage between 0 and 100.",
    );
    expect(validate({ type: "Percent", required: false }, "5.5")).toBe(
      "Enter a percentage between 0 and 100.",
    );
  });

  it("validates Range numeric strings", () => {
    expect(validate({ type: "Range", required: false }, "3.14")).toBeUndefined();
    expect(validate({ type: "Range", required: false }, "abc")).toBe("Enter a valid number.");
  });

  it.each([
    ["2024/02/02", "Enter a valid date (YYYY-MM-DD)."],
    ["2024-02-02", undefined],
  ])("validates Date edge case %s", (value, expected) => {
    expect(validate({ type: "Date", required: false }, value)).toBe(expected);
  });

  it.each([
    ["not a date", "Enter a valid date and time."],
    ["2024-01-01T00:00:00Z", undefined],
  ])("validates DateTime edge case %s", (value, expected) => {
    expect(validate({ type: "DateTime", required: false }, value)).toBe(expected);
  });

  it.each([
    ["true", undefined],
    ["false", undefined],
    ["", "Select a valid option."],
    ["yes", "Select a valid option."],
  ])("validates Boolean edge case %s", (value, expected) => {
    expect(validate({ type: "Boolean", required: false }, value)).toBe(expected);
  });

  it.each(["HtmlText", "Hidden"] as const)(
    "%s accepts any string",
    (type) => {
      expect(validate({ type, required: false }, "anything")).toBeUndefined();
      expect(validate({ type, required: false }, "")).toBeUndefined();
    },
  );
});
