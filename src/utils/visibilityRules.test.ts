import { describe, expect, it } from "vitest";
import type {
  FormField,
  FormFieldOption,
  FormValues,
  VisibilityRuleItem,
} from "../types/FormData";
import { hasOptionValue, resolveFieldVisibility } from "./visibilityRules";

const options = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
];

function textField(overrides: Partial<FormField> = {}): FormField {
  return {
    name: "target",
    label: "Target",
    type: "Text",
    ...overrides,
  } as FormField;
}

function selectField(overrides: Partial<FormField> = {}): FormField {
  return {
    name: "subject",
    label: "Subject",
    type: "Select",
    options,
    ...overrides,
  } as FormField;
}

function checkboxField(overrides: Partial<FormField> = {}): FormField {
  return {
    name: "subject",
    label: "Subject",
    type: "Checkbox",
    options,
    ...overrides,
  } as FormField;
}

function radioField(overrides: Partial<FormField> = {}): FormField {
  return {
    name: "subject",
    label: "Subject",
    type: "Radio",
    options,
    ...overrides,
  } as FormField;
}

function singleCheckboxField(overrides: Partial<FormField> = {}): FormField {
  return {
    name: "subject",
    label: "Subject",
    type: "SingleCheckbox",
    option: { label: "Alpha", value: "a" },
    ...overrides,
  } as FormField;
}

function fieldWithRule(
  rule: VisibilityRuleItem,
  defaultVisibility: "hide" | "show" = "hide",
  overrides: Partial<FormField> = {},
): FormField {
  return textField({
    visibilityRule: {
      defaultVisibility,
      rules: [rule],
    },
    ...overrides,
  });
}

function rule(overrides: Partial<VisibilityRuleItem> = {}): VisibilityRuleItem {
  return {
    subjectField: "subject",
    operator: "equal",
    values: ["match"],
    ...overrides,
  };
}

function resolve(
  field: FormField,
  values: FormValues,
  fields: FormField[] = [field],
) {
  return resolveFieldVisibility(field, values, fields);
}

describe("resolveFieldVisibility", () => {
  it("returns visible field when there is no visibilityRule", () => {
    const field = textField();

    expect(resolveFieldVisibility(field, {})).toEqual({
      field,
      isVisible: true,
    });
  });

  it("keeps defaultVisibility show fields visible when no rule matches", () => {
    const field = fieldWithRule(rule({ values: ["match"] }), "show");

    expect(resolve(field, { subject: "miss" }).isVisible).toBe(true);
  });

  it("hides defaultVisibility show fields when a rule matches", () => {
    const field = fieldWithRule(rule({ values: ["match"] }), "show");

    expect(resolve(field, { subject: "match" }).isVisible).toBe(false);
  });

  it("shows defaultVisibility hide fields when a rule matches", () => {
    const field = fieldWithRule(rule({ values: ["match"] }), "hide");

    expect(resolve(field, { subject: "match" }).isVisible).toBe(true);
  });

  it.each([
    ["equal", "alpha", ["alpha"], true],
    ["equal", "alpha", ["beta"], false],
    ["notEqual", "alpha", ["beta"], true],
    ["notEqual", "alpha", ["alpha"], false],
    ["contains", "alphabet", ["pha"], true],
    ["contains", "alphabet", ["zzz"], false],
    ["notContains", "alphabet", ["zzz"], true],
    ["notContains", "alphabet", ["pha"], false],
    ["isEmpty", "", ["ignored"], true],
    ["isEmpty", "alpha", ["ignored"], false],
    ["isNotEmpty", "alpha", ["ignored"], true],
    ["isNotEmpty", "", ["ignored"], false],
  ])(
    "evaluates %s operator with value %j and rule values %j",
    (operator, subjectValue, ruleValues, expectedVisible) => {
      const field = fieldWithRule(
        rule({
          operator,
          values: ruleValues,
        }),
      );

      expect(resolve(field, { subject: subjectValue }).isVisible).toBe(
        expectedVisible,
      );
    },
  );

  it("matches Select subjects by selected option value", () => {
    const subject = selectField();
    const field = fieldWithRule(rule({ values: ["a"] }));

    expect(resolve(field, { subject: "a" }, [field, subject]).isVisible).toBe(
      true,
    );
  });

  it("matches Select subjects by selected option label", () => {
    const subject = selectField();
    const field = fieldWithRule(rule({ values: ["Alpha"] }));

    expect(resolve(field, { subject: "a" }, [field, subject]).isVisible).toBe(
      true,
    );
  });

  it("matches Select rule values against labels entered as the subject value", () => {
    const subject = selectField();
    const field = fieldWithRule(rule({ values: ["a"] }));

    expect(
      resolve(field, { subject: "Alpha" }, [field, subject]).isVisible,
    ).toBe(true);
  });

  it("matches Checkbox subjects against comma-separated option values", () => {
    const subject = checkboxField();
    const matchingField = fieldWithRule(rule({ values: ["a"] }));
    const missingField = fieldWithRule(rule({ values: ["c"] }));

    expect(
      resolve(matchingField, { subject: "a,b" }, [matchingField, subject])
        .isVisible,
    ).toBe(true);
    expect(
      resolve(missingField, { subject: "a,b" }, [missingField, subject])
        .isVisible,
    ).toBe(false);
  });

  it("defaults missing SingleCheckbox option value to true for rule matching", () => {
    const subject = singleCheckboxField({
      option: { label: "I agree" } as FormFieldOption,
    });
    const field = fieldWithRule(rule({ values: ["true"] }));

    expect(resolve(field, { subject: "true" }, [field, subject]).isVisible).toBe(
      true,
    );
  });

  it("trims and coerces rule and form values before comparison", () => {
    const field = fieldWithRule(rule({ values: [" 42 "] }));

    expect(resolve(field, { subject: 42 as unknown as string }).isVisible).toBe(
      true,
    );
  });

  it("applies altLabel from a matching rule", () => {
    const field = fieldWithRule(rule({ altLabel: "Alternate label" }));

    expect(resolve(field, { subject: "match" }).field.label).toBe(
      "Alternate label",
    );
  });

  it.each([null, undefined])(
    "preserves the original label when altLabel is %s",
    (altLabel) => {
      const field = fieldWithRule(rule({ altLabel }));

      expect(resolve(field, { subject: "match" }).field.label).toBe("Target");
    },
  );

  it.each(["Select", "Checkbox", "Radio"] as const)(
    "replaces %s options with picklistFilterValues from a matching rule",
    (type) => {
      const filteredOptions = [{ label: "Filtered", value: "filtered" }];
      const field = fieldWithRule(
        rule({ picklistFilterValues: filteredOptions }),
        "hide",
        {
          type,
          options,
        },
      );

      const resolved = resolve(field, { subject: "match" }).field;

      expect("options" in resolved ? resolved.options : undefined).toEqual(
        filteredOptions,
      );
    },
  );

  it("replaces SingleCheckbox option with the first picklistFilterValues entry", () => {
    const filteredOptions = [{ label: "Filtered", value: "filtered" }];
    const field = fieldWithRule(
      rule({ picklistFilterValues: filteredOptions }),
      "hide",
      {
        type: "SingleCheckbox",
        option: { label: "Original", value: "original" },
      },
    );

    const resolved = resolve(field, { subject: "match" }).field;

    expect(resolved.type === "SingleCheckbox" ? resolved.option : undefined).toEqual(
      filteredOptions[0],
    );
  });
});

describe("hasOptionValue", () => {
  it("allows an empty value for every field", () => {
    expect(hasOptionValue(selectField(), "")).toBe(true);
  });

  it.each([
    [selectField(), "a", true],
    [selectField(), "x", false],
    [radioField(), "a", true],
    [radioField(), "x", false],
  ])("checks Select and Radio options", (field, value, expected) => {
    expect(hasOptionValue(field, value)).toBe(expected);
  });

  it.each([
    ["a,b", true],
    ["a,x", false],
  ])("checks every comma-separated Checkbox option in %s", (value, expected) => {
    expect(hasOptionValue(checkboxField(), value)).toBe(expected);
  });

  it.each([
    ["a", true],
    ["Alpha", true],
    ["x", false],
  ])("checks SingleCheckbox with an option against %s", (value, expected) => {
    expect(hasOptionValue(singleCheckboxField(), value)).toBe(expected);
  });

  it.each([
    ["true", true],
    [" true ", true],
    ["Alpha", false],
    ["false", false],
  ])("defaults SingleCheckbox without option to true for %s", (value, expected) => {
    expect(
      hasOptionValue(singleCheckboxField({ option: undefined }), value),
    ).toBe(expected);
  });
});
