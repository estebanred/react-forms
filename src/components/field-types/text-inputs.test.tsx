import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderField } from "../../test/helpers";
import type { FormField } from "../../types/FormData";

type TextLikeType =
  | "Text"
  | "TextArea"
  | "Email"
  | "Phone"
  | "URL"
  | "Integer"
  | "Float"
  | "Currency"
  | "Percent"
  | "Score";

type TextFieldCase = {
  type: TextLikeType;
  element: "input" | "textarea";
  inputType?: string;
  validValue: string;
  invalidValue: string;
  invalidError: string;
  required?: boolean;
  // Pre-type a value so that changing to invalidValue produces a real DOM
  // change event for the cases (Text / TextArea) where the default value and
  // invalid value are both empty strings.
  primeValue?: string;
};

const cases: TextFieldCase[] = [
  {
    type: "Text",
    element: "input",
    inputType: "text",
    validValue: "hello",
    invalidValue: "",
    invalidError: "This field is required",
    required: true,
    primeValue: "prefilled",
  },
  {
    type: "TextArea",
    element: "textarea",
    validValue: "hello\nworld",
    invalidValue: "",
    invalidError: "This field is required",
    required: true,
    primeValue: "prefilled",
  },
  {
    type: "Email",
    element: "input",
    inputType: "email",
    validValue: "person@example.com",
    invalidValue: "not-an-email",
    invalidError: "Enter a valid email address.",
  },
  {
    type: "Phone",
    element: "input",
    inputType: "tel",
    validValue: "+1 (555) 123-4567",
    invalidValue: "abc",
    invalidError: "Enter a valid phone number.",
  },
  {
    type: "URL",
    element: "input",
    inputType: "url",
    validValue: "https://example.com",
    invalidValue: "example.com",
    invalidError: "Enter a valid URL.",
  },
  {
    type: "Integer",
    element: "input",
    inputType: "number",
    validValue: "42",
    invalidValue: "1.5",
    invalidError: "Enter a valid whole number.",
  },
  // Float/Currency are <input type="number"> and jsdom sanitises non-numeric
  // assignments to "" (HTML spec), so no non-empty invalid string survives the
  // DOM round-trip. Drive the required-branch invalid case instead.
  {
    type: "Float",
    element: "input",
    inputType: "number",
    validValue: "3.14",
    invalidValue: "",
    invalidError: "This field is required",
    required: true,
    primeValue: "3.14",
  },
  {
    type: "Currency",
    element: "input",
    inputType: "number",
    validValue: "9.99",
    invalidValue: "",
    invalidError: "This field is required",
    required: true,
    primeValue: "9.99",
  },
  {
    type: "Percent",
    element: "input",
    inputType: "number",
    validValue: "50",
    invalidValue: "101",
    invalidError: "Enter a percentage between 0 and 100.",
  },
  {
    type: "Score",
    element: "input",
    inputType: "number",
    validValue: "42",
    invalidValue: "1.5",
    invalidError: "Enter a valid whole number.",
  },
];

function makeField(testCase: TextFieldCase): FormField {
  return {
    name: `${testCase.type.toLowerCase()}Field`,
    label: `${testCase.type} label`,
    type: testCase.type,
    required: Boolean(testCase.required),
  } as FormField;
}

function getInput(
  container: HTMLElement,
  element: "input" | "textarea",
): HTMLInputElement | HTMLTextAreaElement {
  const el = container.querySelector(element);
  if (!el) throw new Error(`No <${element}> found in rendered output`);
  return el as HTMLInputElement | HTMLTextAreaElement;
}

describe.each(cases)("$type field", (testCase) => {
  it("renders with the correct name and element", () => {
    const field = makeField(testCase);
    const { container } = renderField(field);
    const input = getInput(container, testCase.element);

    expect(input).toBeInTheDocument();
    expect(input.getAttribute("name")).toBe(field.name);

    if (testCase.element === "textarea") {
      expect(input.tagName).toBe("TEXTAREA");
    } else {
      // `.type` falls back to "text" for `<input>` without an explicit type attribute.
      expect((input as HTMLInputElement).type).toBe(testCase.inputType);
    }
  });

  it("updates the form value on change", () => {
    const field = makeField(testCase);
    const { container, form } = renderField(field);
    const input = getInput(container, testCase.element);

    fireEvent.change(input, { target: { value: testCase.validValue } });

    expect(form.state.values[field.name]).toBe(testCase.validValue);
  });

  it("surfaces the error for an invalid value after a blur", () => {
    const field = makeField(testCase);
    const { container, getByText } = renderField(field);
    const input = getInput(container, testCase.element);

    if (testCase.primeValue) {
      fireEvent.change(input, { target: { value: testCase.primeValue } });
    }
    fireEvent.change(input, { target: { value: testCase.invalidValue } });
    fireEvent.blur(input);

    // TanStack Form v1 flags a field as touched on change, so the exact moment
    // the error surfaces (change vs blur) isn't load-bearing for this test —
    // just that it is visible after the user interacts and leaves the field.
    expect(getByText(testCase.invalidError)).toBeInTheDocument();
  });

  it("shows no error for a valid value after blur", () => {
    const field = makeField(testCase);
    const { container, queryByText } = renderField(field);
    const input = getInput(container, testCase.element);

    fireEvent.change(input, { target: { value: testCase.validValue } });
    fireEvent.blur(input);

    expect(queryByText(testCase.invalidError)).toBeNull();
  });
});
