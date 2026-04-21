import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderField } from "../../test/helpers";
import type { FormField } from "../../types/FormData";

type DateLikeType = "Date" | "DateTime";

type DateFieldCase = {
  type: DateLikeType;
  inputType: "date" | "datetime-local";
  validValue: string;
  invalidError: string;
};

// jsdom enforces the HTML5 type=date / datetime-local value format at the DOM
// level — invalid strings get coerced to "" on assignment, so validator-level
// invalid inputs can't be driven through fireEvent.change. Validator branches
// for these types are exercised in `src/utils/validators.test.ts`; here we
// assert rendering, the round-trip for valid values, and the no-error path
// after blur.
const cases: DateFieldCase[] = [
  {
    type: "Date",
    inputType: "date",
    validValue: "2024-02-02",
    invalidError: "Enter a valid date (YYYY-MM-DD).",
  },
  {
    type: "DateTime",
    inputType: "datetime-local",
    validValue: "2024-01-01T00:00",
    invalidError: "Enter a valid date and time.",
  },
];

function makeField(testCase: DateFieldCase): FormField {
  return {
    name: `${testCase.type.toLowerCase()}Field`,
    label: `${testCase.type} label`,
    type: testCase.type,
    required: false,
  } as FormField;
}

function getInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector("input");
  if (!el) throw new Error("No <input> found in rendered output");
  return el;
}

describe.each(cases)("$type field", (testCase) => {
  it("renders with the correct name and input type", () => {
    const field = makeField(testCase);
    const { container } = renderField(field);
    const input = getInput(container);

    expect(input).toBeInTheDocument();
    expect(input.getAttribute("name")).toBe(field.name);
    expect(input.getAttribute("type")).toBe(testCase.inputType);
  });

  it("updates the form value on change", () => {
    const field = makeField(testCase);
    const { container, form } = renderField(field);
    const input = getInput(container);

    fireEvent.change(input, { target: { value: testCase.validValue } });

    expect(form.state.values[field.name]).toBe(testCase.validValue);
  });

  it("shows no error for a valid value after blur", () => {
    const field = makeField(testCase);
    const { container, queryByText } = renderField(field);
    const input = getInput(container);

    fireEvent.change(input, { target: { value: testCase.validValue } });
    fireEvent.blur(input);

    expect(queryByText(testCase.invalidError)).toBeNull();
  });
});
