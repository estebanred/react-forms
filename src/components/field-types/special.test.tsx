import { act, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderField } from "../../test/helpers";
import type { FormField } from "../../types/FormData";

describe("Range field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "rangeField",
      label: "Range label",
      type: "Range",
      min: 0,
      max: 10,
      required: false,
      ...overrides,
    } as FormField;
  }

  it("renders an <input type=range> with min/max attributes from the field definition", () => {
    const field = makeField({ min: 5, max: 25 });
    const { container } = renderField(field);
    const input = container.querySelector<HTMLInputElement>(
      "input[type=range]",
    );
    if (!input) throw new Error("No <input type=range> found");

    expect(input.getAttribute("name")).toBe(field.name);
    expect(input.getAttribute("min")).toBe("5");
    expect(input.getAttribute("max")).toBe("25");
  });

  it("mirrors the current value in the sibling display <span>", () => {
    const field = makeField({ min: 0, max: 100 });
    const { container, form } = renderField(field, { defaultValue: "42" });
    const span = container.querySelector(
      "span[class*='text-right'][class*='text-white']",
    );
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("42");

    const input = container.querySelector<HTMLInputElement>(
      "input[type=range]",
    )!;
    fireEvent.change(input, { target: { value: "77" } });

    expect(form.state.values[field.name]).toBe("77");
    expect(
      container.querySelector("span[class*='text-right'][class*='text-white']")
        ?.textContent,
    ).toBe("77");
  });
});

describe("HtmlText field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "htmlTextField",
      label: "<em>fallback</em>",
      type: "HtmlText",
      ...overrides,
    } as FormField;
  }

  it("renders the placeholder HTML via dangerouslySetInnerHTML when placeholder is present", () => {
    const field = makeField({ placeholder: "<strong>Terms &amp; Conditions</strong>" });
    const { container } = renderField(field);

    // No form control rendered for HtmlText.
    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector("textarea")).toBeNull();
    expect(container.querySelector("select")).toBeNull();

    const wrapper = container.querySelector("div[class*='rounded-2xl']");
    expect(wrapper?.innerHTML).toBe(
      "<strong>Terms &amp; Conditions</strong>",
    );
  });

  it("falls back to the label when placeholder is absent", () => {
    const field = makeField();
    const { container } = renderField(field);
    const wrapper = container.querySelector("div[class*='rounded-2xl']");

    expect(wrapper?.innerHTML).toBe("<em>fallback</em>");
  });
});

describe("Hidden field", () => {
  function makeField(overrides: Partial<FormField> = {}): FormField {
    return {
      name: "hiddenField",
      label: "",
      type: "Hidden",
      ...overrides,
    } as FormField;
  }

  it("renders an <input type=hidden> that is not visible to users", () => {
    const field = makeField();
    const { container } = renderField(field, { defaultValue: "secret-123" });
    const input = container.querySelector<HTMLInputElement>(
      "input[type=hidden]",
    );
    if (!input) throw new Error("No <input type=hidden> found");

    expect(input.getAttribute("name")).toBe(field.name);
    expect(input.value).toBe("secret-123");
    // Hidden inputs have no intrinsic visibility; neither a <label> span nor
    // error <p> should be emitted (Hidden.tsx does not wrap with FieldLayout).
    expect(container.querySelector("span")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("mirrors the form value in the DOM after a programmatic update", () => {
    const field = makeField();
    const { container, form } = renderField(field, { defaultValue: "start" });
    const input = container.querySelector<HTMLInputElement>(
      "input[type=hidden]",
    )!;
    expect(input.value).toBe("start");

    // Hidden inputs don't emit change events in normal use; updates come from
    // form state. Setting the field value should re-render with the new value.
    act(() => {
      form.setFieldValue(field.name, "updated");
    });

    const refreshed = container.querySelector<HTMLInputElement>(
      "input[type=hidden]",
    )!;
    expect(refreshed.value).toBe("updated");
    expect(form.state.values[field.name]).toBe("updated");
  });
});
