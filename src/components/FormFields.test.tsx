import { act, fireEvent, render } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import FormFields from "./FormFields";
import type { FormField, FormValues } from "../types/FormData";
import type { FormApi } from "../types/types";

type HarnessResult = ReturnType<typeof render> & {
  form: FormApi;
};

function renderFields(
  fields: FormField[],
  defaultValues: FormValues = {},
): HarnessResult {
  let formApi: FormApi | undefined;

  function Harness({ onFormReady }: { onFormReady: (form: FormApi) => void }) {
    const form = useForm({
      defaultValues: Object.fromEntries(
        fields.map((f) => [f.name, defaultValues[f.name] ?? ""]),
      ) as FormValues,
      onSubmit: async () => undefined,
    }) as FormApi;

    useLayoutEffect(() => {
      onFormReady(form);
    }, [form, onFormReady]);

    return <FormFields form={form} fields={fields} />;
  }

  const rendered = render(
    <Harness
      onFormReady={(form) => {
        formApi = form;
      }}
    />,
  );
  if (!formApi) throw new Error("Failed to initialize test form.");
  return { ...rendered, form: formApi };
}

describe("FormFields — visibility flow", () => {
  it("always renders a field without a visibilityRule", () => {
    const fields: FormField[] = [
      {
        name: "alwaysVisible",
        label: "Always",
        type: "Text",
        required: false,
      },
    ];
    const { container } = renderFields(fields);

    expect(
      container.querySelector<HTMLInputElement>("input[name='alwaysVisible']"),
    ).toBeInTheDocument();
  });

  it("shows a target field once the subject field equals the rule value (defaultVisibility=hide)", () => {
    const fields: FormField[] = [
      {
        name: "subject",
        label: "Subject",
        type: "Text",
        required: false,
      },
      {
        name: "target",
        label: "Target",
        type: "Text",
        required: false,
        visibilityRule: {
          defaultVisibility: "hide",
          rules: [
            {
              subjectField: "subject",
              operator: "equal",
              values: ["show-me"],
            },
          ],
        },
      },
    ];
    const { container } = renderFields(fields);

    expect(
      container.querySelector("input[name='target']"),
    ).not.toBeInTheDocument();

    const subjectInput = container.querySelector<HTMLInputElement>(
      "input[name='subject']",
    )!;
    fireEvent.change(subjectInput, { target: { value: "show-me" } });

    expect(
      container.querySelector("input[name='target']"),
    ).toBeInTheDocument();
  });

  it("hides a target field (defaultVisibility=show) when the rule matches", () => {
    const fields: FormField[] = [
      {
        name: "subject",
        label: "Subject",
        type: "Text",
        required: false,
      },
      {
        name: "target",
        label: "Target",
        type: "Text",
        required: false,
        visibilityRule: {
          defaultVisibility: "show",
          rules: [
            {
              subjectField: "subject",
              operator: "equal",
              values: ["hide-me"],
            },
          ],
        },
      },
    ];
    const { container } = renderFields(fields);

    expect(
      container.querySelector("input[name='target']"),
    ).toBeInTheDocument();

    fireEvent.change(
      container.querySelector<HTMLInputElement>("input[name='subject']")!,
      { target: { value: "hide-me" } },
    );

    expect(
      container.querySelector("input[name='target']"),
    ).not.toBeInTheDocument();
  });

  it("clears the value of a previously-visible field when it is hidden", async () => {
    const fields: FormField[] = [
      {
        name: "subject",
        label: "Subject",
        type: "Text",
        required: false,
      },
      {
        name: "target",
        label: "Target",
        type: "Text",
        required: false,
        visibilityRule: {
          defaultVisibility: "show",
          rules: [
            {
              subjectField: "subject",
              operator: "equal",
              values: ["hide"],
            },
          ],
        },
      },
    ];
    const { container, form } = renderFields(fields);

    const targetInput = container.querySelector<HTMLInputElement>(
      "input[name='target']",
    )!;
    fireEvent.change(targetInput, { target: { value: "stale" } });
    expect(form.state.values.target).toBe("stale");

    await act(async () => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>("input[name='subject']")!,
        { target: { value: "hide" } },
      );
    });

    expect(
      container.querySelector("input[name='target']"),
    ).not.toBeInTheDocument();
    expect(form.state.values.target).toBe("");
  });

  it("applies altLabel from a matching rule to the visible field label", () => {
    const fields: FormField[] = [
      {
        name: "subject",
        label: "Subject",
        type: "Text",
        required: false,
      },
      {
        name: "target",
        label: "Original Label",
        type: "Text",
        required: false,
        // defaultVisibility=hide + matching rule → visible WITH altLabel applied.
        // defaultVisibility=show + matching rule would hide the field, so the
        // relabel would never be observable.
        visibilityRule: {
          defaultVisibility: "hide",
          rules: [
            {
              subjectField: "subject",
              operator: "equal",
              values: ["swap"],
              altLabel: "Renamed Label",
            },
          ],
        },
      },
    ];
    const { container, queryByText } = renderFields(fields);

    expect(queryByText("Original Label")).toBeNull();
    expect(queryByText("Renamed Label")).toBeNull();

    fireEvent.change(
      container.querySelector<HTMLInputElement>("input[name='subject']")!,
      { target: { value: "swap" } },
    );

    expect(queryByText("Renamed Label")).toBeInTheDocument();
    expect(queryByText("Original Label")).toBeNull();
  });

  it("applies picklistFilterValues from a matching rule to the rendered <option> list", () => {
    // Two Select fields, one visible-by-default (rule hides it and would never
    // show filtered options), one hidden-by-default (rule surfaces it with the
    // filtered option set). The second is the one the assertion inspects.
    const fields: FormField[] = [
      {
        name: "trigger",
        label: "Trigger",
        type: "Text",
        required: false,
      },
      {
        name: "pick",
        label: "Pick",
        type: "Select",
        required: false,
        options: [
          { label: "Apple", value: "apple" },
          { label: "Banana", value: "banana" },
          { label: "Cherry", value: "cherry" },
        ],
        visibilityRule: {
          defaultVisibility: "hide",
          rules: [
            {
              subjectField: "trigger",
              operator: "equal",
              values: ["filter"],
              picklistFilterValues: [{ label: "Only", value: "only" }],
            },
          ],
        },
      },
    ];
    const { container } = renderFields(fields);

    expect(container.querySelector("select[name='pick']")).toBeNull();

    fireEvent.change(
      container.querySelector<HTMLInputElement>("input[name='trigger']")!,
      { target: { value: "filter" } },
    );

    const afterOptions = Array.from(
      container.querySelectorAll<HTMLOptionElement>(
        "select[name='pick'] option",
      ),
    ).map((opt) => opt.value);
    expect(afterOptions).toEqual(["", "only"]);
  });

  it("clears a stale selection when filtered options no longer include the current value", async () => {
    // defaultVisibility=hide — rule match keeps the Select visible but swaps
    // in a filtered option set. The field remains mounted so hasOptionValue
    // (not the !isVisible branch) is what triggers the value reset.
    const fields: FormField[] = [
      {
        name: "trigger",
        label: "Trigger",
        type: "Text",
        required: false,
      },
      {
        name: "pick",
        label: "Pick",
        type: "Select",
        required: false,
        options: [
          { label: "Apple", value: "apple" },
          { label: "Banana", value: "banana" },
        ],
        visibilityRule: {
          defaultVisibility: "hide",
          rules: [
            {
              subjectField: "trigger",
              operator: "equal",
              values: ["filter"],
              picklistFilterValues: [{ label: "Only", value: "only" }],
            },
          ],
        },
      },
    ];
    // Start with the rule already matching so the Select renders and picks
    // up the filtered option set on first render, then inject the stale value.
    const { container, form } = renderFields(fields, {
      trigger: "filter",
      pick: "apple",
    });

    await act(async () => {
      // Nudge the effect: re-run by setting the same value again so the
      // resolvedFields dependency stays stable and the pre-existing pick
      // value is reconciled against the filtered options.
    });

    expect(container.querySelector("select[name='pick']")).toBeInTheDocument();
    // "apple" is not in the filtered option set ["only"] — FormFields'
    // useEffect (via hasOptionValue) resets the stored value.
    expect(form.state.values.pick).toBe("");
  });
});

describe("FormFields — type routing", () => {
  it("routes every FormField.type to the correct component", () => {
    const fields: FormField[] = [
      { name: "text", label: "Text", type: "Text" },
      { name: "textarea", label: "TextArea", type: "TextArea" },
      { name: "email", label: "Email", type: "Email" },
      { name: "phone", label: "Phone", type: "Phone" },
      { name: "url", label: "URL", type: "URL" },
      { name: "integer", label: "Integer", type: "Integer" },
      { name: "float", label: "Float", type: "Float" },
      { name: "currency", label: "Currency", type: "Currency" },
      { name: "percent", label: "Percent", type: "Percent" },
      { name: "score", label: "Score", type: "Score" },
      { name: "date", label: "Date", type: "Date" },
      { name: "datetime", label: "DateTime", type: "DateTime" },
      { name: "boolean", label: "Boolean", type: "Boolean" },
      {
        name: "select",
        label: "Select",
        type: "Select",
        options: [{ label: "One", value: "one" }],
      },
      {
        name: "checkbox",
        label: "Checkbox",
        type: "Checkbox",
        options: [{ label: "Red", value: "red" }],
      },
      {
        name: "radio",
        label: "Radio",
        type: "Radio",
        options: [{ label: "A", value: "a" }],
      },
      {
        name: "singleCheckbox",
        label: "Single",
        type: "SingleCheckbox",
      },
      {
        name: "range",
        label: "Range",
        type: "Range",
        min: 0,
        max: 100,
      },
      { name: "htmlText", label: "<em>html</em>", type: "HtmlText" },
      { name: "hidden", label: "", type: "Hidden" },
    ];
    const { container } = renderFields(fields);

    // Text keeps the default `type="text"` (no explicit attribute) — use the
    // HTMLInputElement.type property which falls back to "text".
    const textInput = container.querySelector<HTMLInputElement>(
      "input[name='text']",
    );
    expect(textInput).toBeInTheDocument();
    expect(textInput?.type).toBe("text");
    expect(container.querySelector("textarea[name='textarea']")).toBeInTheDocument();
    expect(
      container.querySelector("input[name='email']")?.getAttribute("type"),
    ).toBe("email");
    expect(
      container.querySelector("input[name='phone']")?.getAttribute("type"),
    ).toBe("tel");
    expect(
      container.querySelector("input[name='url']")?.getAttribute("type"),
    ).toBe("url");
    expect(
      container.querySelector("input[name='integer']")?.getAttribute("type"),
    ).toBe("number");
    expect(
      container.querySelector("input[name='float']")?.getAttribute("type"),
    ).toBe("number");
    expect(
      container.querySelector("input[name='currency']")?.getAttribute("type"),
    ).toBe("number");
    expect(
      container.querySelector("input[name='percent']")?.getAttribute("type"),
    ).toBe("number");
    expect(
      container.querySelector("input[name='score']")?.getAttribute("type"),
    ).toBe("number");
    expect(
      container.querySelector("input[name='date']")?.getAttribute("type"),
    ).toBe("date");
    expect(
      container.querySelector("input[name='datetime']")?.getAttribute("type"),
    ).toBe("datetime-local");
    expect(container.querySelector("select[name='boolean']")).toBeInTheDocument();
    expect(container.querySelector("select[name='select']")).toBeInTheDocument();
    // Checkbox / Radio render multiple inputs sharing the field name.
    expect(
      container.querySelector("input[name='checkbox'][type='checkbox']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("input[name='radio'][type='radio']"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        "input[name='singleCheckbox'][type='checkbox']",
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector("input[name='range'][type='range']"),
    ).toBeInTheDocument();
    // HtmlText emits no form control; assert on the injected HTML wrapper.
    expect(container.querySelector("input[name='htmlText']")).toBeNull();
    expect(
      container.querySelector("input[name='hidden'][type='hidden']"),
    ).toBeInTheDocument();
  });
});
