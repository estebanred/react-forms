import { fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderField } from "../../test/helpers";
import type { FormField } from "../../types/FormData";

describe("Select field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "selectField",
      label: "Select label",
      type: "Select",
      required: false,
      options: [
        { label: "One", value: "one" },
        { label: "Two", value: "two" },
      ],
      ...overrides,
    } as FormField;
  }

  it("renders a <select> with the option list plus a blank prompt", () => {
    const field = makeField();
    const { container } = renderField(field);
    const select = container.querySelector("select");
    if (!select) throw new Error("No <select> found");

    expect(select.getAttribute("name")).toBe(field.name);
    const options = Array.from(select.options).map((opt) => ({
      label: opt.textContent,
      value: opt.value,
    }));
    expect(options).toEqual([
      { label: "Select…", value: "" },
      { label: "One", value: "one" },
      { label: "Two", value: "two" },
    ]);
  });

  it("updates the form value on change", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const select = container.querySelector("select")!;

    fireEvent.change(select, { target: { value: "two" } });

    expect(form.state.values[field.name]).toBe("two");
  });

  it("shows the required error after the user picks a value and clears it back to empty on blur", () => {
    const field = makeField({ required: true });
    const { container, getByText } = renderField(field);
    const select = container.querySelector("select")!;

    // The onChange validator only runs on value changes — drive one round-trip
    // to populate the error state before blur.
    fireEvent.change(select, { target: { value: "two" } });
    fireEvent.change(select, { target: { value: "" } });
    fireEvent.blur(select);

    expect(getByText("Please make a selection.")).toBeInTheDocument();
  });
});

describe("Radio field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "radioField",
      label: "Radio label",
      type: "Radio",
      required: false,
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" },
      ],
      ...overrides,
    } as FormField;
  }

  it("renders one <input type=radio> per option sharing the field name", () => {
    const field = makeField();
    const { container } = renderField(field);
    const radios = container.querySelectorAll<HTMLInputElement>(
      "input[type=radio]",
    );

    expect(radios).toHaveLength(2);
    expect(Array.from(radios).map((r) => r.value)).toEqual(["a", "b"]);
    for (const radio of radios) {
      expect(radio.getAttribute("name")).toBe(field.name);
    }
  });

  it("updates the form value when an option is clicked", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const beta = container.querySelector<HTMLInputElement>(
      "input[type=radio][value='b']",
    )!;

    fireEvent.click(beta);

    expect(form.state.values[field.name]).toBe("b");
    expect(beta.checked).toBe(true);
  });

  it("does not show an error on blur after a valid selection", () => {
    const field = makeField({ required: true });
    const { container, queryByText } = renderField(field);
    const beta = container.querySelector<HTMLInputElement>(
      "input[type=radio][value='b']",
    )!;

    fireEvent.click(beta);
    fireEvent.blur(beta);

    expect(queryByText("Please make a selection.")).toBeNull();
  });
});

describe("Checkbox field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "checkboxField",
      label: "Checkbox label",
      type: "Checkbox",
      required: false,
      options: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
        { label: "Green", value: "green" },
      ],
      ...overrides,
    } as FormField;
  }

  it("renders one <input type=checkbox> per option sharing the field name", () => {
    const field = makeField();
    const { container } = renderField(field);
    const boxes = container.querySelectorAll<HTMLInputElement>(
      "input[type=checkbox]",
    );

    expect(boxes).toHaveLength(3);
    for (const box of boxes) {
      expect(box.getAttribute("name")).toBe(field.name);
    }
  });

  it("builds a comma-separated value as options are toggled on", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const red = container.querySelector<HTMLInputElement>(
      "input[type=checkbox][value='red']",
    )!;
    const blue = container.querySelector<HTMLInputElement>(
      "input[type=checkbox][value='blue']",
    )!;

    fireEvent.click(red);
    expect(form.state.values[field.name]).toBe("red");
    expect(red.checked).toBe(true);

    fireEvent.click(blue);
    expect(form.state.values[field.name]).toBe("red,blue");
    expect(blue.checked).toBe(true);
  });

  it("removes the value from the comma-separated list when an option is untoggled", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const red = container.querySelector<HTMLInputElement>(
      "input[type=checkbox][value='red']",
    )!;
    const blue = container.querySelector<HTMLInputElement>(
      "input[type=checkbox][value='blue']",
    )!;

    fireEvent.click(red);
    fireEvent.click(blue);
    expect(form.state.values[field.name]).toBe("red,blue");

    fireEvent.click(red);
    expect(form.state.values[field.name]).toBe("blue");
    expect(red.checked).toBe(false);
    expect(blue.checked).toBe(true);
  });

  it("shows the required error after toggling on then off and blurring", () => {
    const field = makeField({ required: true });
    const { container, getByText } = renderField(field);
    const red = container.querySelector<HTMLInputElement>(
      "input[type=checkbox][value='red']",
    )!;

    fireEvent.click(red);
    fireEvent.click(red);
    fireEvent.blur(red);

    expect(getByText("Please select at least one option.")).toBeInTheDocument();
  });
});

describe("SingleCheckbox field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "singleCheckboxField",
      label: "Accept terms",
      type: "SingleCheckbox",
      required: false,
      ...overrides,
    } as FormField;
  }

  it("renders a single checkbox and uses the field label (via dangerouslySetInnerHTML) when no option is provided", () => {
    const field = makeField({ label: "<em>Accept</em> terms" });
    const { container } = renderField(field);
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;

    expect(checkbox).toBeInTheDocument();
    expect(checkbox.getAttribute("name")).toBe(field.name);
    // Label falls back to field.label when no `option` — HTML is injected as-is.
    const htmlSpan = container.querySelector("span[class*='text-white']");
    expect(htmlSpan?.innerHTML).toBe("<em>Accept</em> terms");
  });

  it("defaults the stored value to 'true' when no option.value is supplied", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;

    fireEvent.click(checkbox);

    expect(form.state.values[field.name]).toBe("true");
    expect(checkbox.checked).toBe(true);
  });

  it("uses option.label (HTML) and option.value when option is provided", () => {
    const field = makeField({
      option: { label: "<strong>yes</strong>", value: "yes" },
    } as Partial<FormField>);
    const { container, form } = renderField(field);
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;
    const htmlSpan = container.querySelector("span[class*='text-white']");

    expect(htmlSpan?.innerHTML).toBe("<strong>yes</strong>");

    fireEvent.click(checkbox);

    expect(form.state.values[field.name]).toBe("yes");
  });

  it("keeps the required marker inline when the visible label comes from option.label", () => {
    const field = makeField({
      label: "",
      required: true,
      option: { label: "<strong>Accept</strong> terms", value: "yes" },
    } as Partial<FormField>);
    const { container } = renderField(field);

    const requiredMarker = Array.from(container.querySelectorAll("span")).find(
      (element) => element.textContent === "*",
    );

    expect(requiredMarker).toBeInTheDocument();
  });

  it("clears the value back to empty when unchecked", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;

    fireEvent.click(checkbox);
    expect(form.state.values[field.name]).toBe("true");
    fireEvent.click(checkbox);
    expect(form.state.values[field.name]).toBe("");
  });

  it("shows the required error after toggling on then off and blurring", () => {
    const field = makeField({ required: true });
    const { container, getByText } = renderField(field);
    const checkbox = container.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.blur(checkbox);

    expect(getByText("This field is required.")).toBeInTheDocument();
  });
});

describe("Boolean field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "booleanField",
      label: "Boolean label",
      type: "Boolean",
      required: false,
      ...overrides,
    } as FormField;
  }

  it("renders a <select> with exactly the 'true' and 'false' options (plus blank prompt)", () => {
    const field = makeField();
    const { container } = renderField(field);
    const select = container.querySelector("select");
    if (!select) throw new Error("No <select> found");

    expect(select.getAttribute("name")).toBe(field.name);
    expect(
      Array.from(select.options).map((opt) => ({
        text: opt.textContent,
        value: opt.value,
      })),
    ).toEqual([
      { text: "Select…", value: "" },
      { text: "True", value: "true" },
      { text: "False", value: "false" },
    ]);
  });

  it("updates the form value to 'true' / 'false' on change", () => {
    const field = makeField();
    const { container, form } = renderField(field);
    const select = container.querySelector("select")!;

    fireEvent.change(select, { target: { value: "true" } });
    expect(form.state.values[field.name]).toBe("true");

    fireEvent.change(select, { target: { value: "false" } });
    expect(form.state.values[field.name]).toBe("false");
  });

  it("shows the enum validation error after clearing a valid selection on blur (Boolean always enforces the enum)", () => {
    const field = makeField();
    const { container, getByText } = renderField(field);
    const select = container.querySelector("select")!;

    // Drive one onChange cycle so the validator runs and records the error
    // before blur surfaces it through FieldLayout.
    fireEvent.change(select, { target: { value: "true" } });
    fireEvent.change(select, { target: { value: "" } });
    fireEvent.blur(select);

    expect(getByText("Select a valid option.")).toBeInTheDocument();
  });

  it("hides the error for a valid selection after blur", () => {
    const field = makeField();
    const { container, queryByText } = renderField(field);
    const select = container.querySelector("select")!;

    fireEvent.change(select, { target: { value: "true" } });
    fireEvent.blur(select);

    // Re-query within the container to avoid stale refs.
    expect(
      within(container).queryByText("Select a valid option."),
    ).toBeNull();
    // Also assert via the caller-returned query to be safe.
    expect(queryByText("Select a valid option.")).toBeNull();
  });
});
