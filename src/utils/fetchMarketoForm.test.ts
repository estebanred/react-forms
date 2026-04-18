import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormField } from "../types/FormData";
import type {
  MarketoField,
  MarketoFormResponse,
} from "../types/MarketoFormResponse";
import {
  makeHiddenField,
  marketoFormFixture,
} from "../test/fixtures/marketoForm";
import { fetchMarketoForm } from "./fetchMarketoForm";

const baseUrl = "https://example.marketo.com";
const munchkinId = "123-ABC-456";
const formId = 7471;

function formWithFields(fields: MarketoField[]): MarketoFormResponse {
  return {
    rows: fields.map((field) => [field]),
  };
}

function marketoField(overrides: Partial<MarketoField> = {}): MarketoField {
  return {
    Id: 1,
    Name: "Field",
    Datatype: "string",
    InputLabel: "Field",
    ...overrides,
  };
}

function mockFetchForm(response: MarketoFormResponse) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    statusText: "OK",
    json: vi.fn().mockResolvedValue(response),
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function setCookieHeader(value: string) {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    writable: true,
    value,
  });
}

function clearCookieHeader() {
  Reflect.deleteProperty(document, "cookie");
}

async function resolveHiddenDefault(
  overrides: Partial<MarketoField> = {},
): Promise<string> {
  mockFetchForm(
    formWithFields([
      makeHiddenField({
        Name: "HiddenCase",
        InputInitialValue: "fallback",
        ...overrides,
      }),
    ]),
  );

  const { defaultValues } = await fetchMarketoForm(baseUrl, munchkinId, formId);

  return defaultValues.HiddenCase;
}

function findField<TType extends FormField["type"]>(
  fields: FormField[],
  name: string,
  type: TType,
): Extract<FormField, { type: TType }> {
  const field = fields.find((candidate) => candidate.name === name);
  expect(field).toMatchObject({ type });

  return field as Extract<FormField, { type: TType }>;
}

describe("fetchMarketoForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    window.history.pushState({}, "", "/");
    clearCookieHeader();
  });

  afterEach(() => {
    clearCookieHeader();
    window.history.pushState({}, "", "/");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws when the Marketo request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Gateway",
      }),
    );

    await expect(fetchMarketoForm(baseUrl, munchkinId, formId)).rejects.toThrow(
      "Failed to fetch Marketo form 7471: Bad Gateway",
    );
  });

  it("fetches the expected Marketo endpoint", async () => {
    const fetchMock = mockFetchForm(marketoFormFixture);

    await fetchMarketoForm(baseUrl, munchkinId, formId);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.marketo.com/index.php/form/getForm?munchkinId=123-ABC-456&form=7471",
    );
  });

  it("maps all Marketo datatypes in the fixture to form field types", async () => {
    mockFetchForm(marketoFormFixture);

    const { fields } = await fetchMarketoForm(baseUrl, munchkinId, formId);

    expect(fields).toHaveLength(marketoFormFixture.rows.length);
    expect(Object.fromEntries(fields.map((field) => [field.name, field.type])))
      .toMatchObject({
        TextField: "Text",
        EmailField: "Email",
        PhoneField: "Phone",
        PicklistField: "Select",
        RadioField: "Radio",
        BooleanField: "Boolean",
        HtmlTextField: "HtmlText",
        CheckboxField: "Checkbox",
        HiddenField: "Hidden",
        TextAreaField: "TextArea",
        UrlField: "URL",
        IntegerField: "Integer",
        FloatField: "Float",
        CurrencyField: "Currency",
        PercentField: "Percent",
        ScoreField: "Score",
        DateField: "Date",
        DateTimeField: "DateTime",
      });
  });

  it("maps checkbox fields with multiple options to Checkbox and one option to SingleCheckbox", async () => {
    mockFetchForm(
      formWithFields([
        marketoField({
          Name: "MultiCheckbox",
          Datatype: "checkbox",
          PicklistValues: [
            { label: "One", value: "one" },
            { label: "Two", value: "two" },
          ],
        }),
        marketoField({
          Name: "SingleCheckbox",
          Datatype: "checkbox",
          PicklistValues: [{ label: "Only", value: "only" }],
        }),
      ]),
    );

    const { fields } = await fetchMarketoForm(baseUrl, munchkinId, formId);

    expect(findField(fields, "MultiCheckbox", "Checkbox").options).toEqual([
      { label: "One", value: "one" },
      { label: "Two", value: "two" },
    ]);
    expect(findField(fields, "SingleCheckbox", "SingleCheckbox").option).toEqual(
      { label: "Only", value: "only" },
    );
  });

  it("filters blank picklist option values", async () => {
    mockFetchForm(marketoFormFixture);

    const { fields } = await fetchMarketoForm(baseUrl, munchkinId, formId);
    const picklist = findField(fields, "PicklistField", "Select");

    expect(picklist.options).toEqual([
      { label: "One", value: "one" },
      { label: "Two", value: "two" },
    ]);
  });

  it("omits visibilityRule when Marketo sends an empty rules array", async () => {
    mockFetchForm(
      formWithFields([
        marketoField({
          Name: "VisibilityTarget",
          VisibilityRule: {
            defaultVisibility: "show",
            rules: [],
          },
        }),
      ]),
    );

    const { fields } = await fetchMarketoForm(baseUrl, munchkinId, formId);

    expect(fields[0].visibilityRule).toBeUndefined();
  });

  it("falls back to hide for unrecognized defaultVisibility values", async () => {
    mockFetchForm(
      formWithFields([
        marketoField({
          Name: "VisibilityTarget",
          VisibilityRule: {
            defaultVisibility: "sometimes" as never,
            rules: [
              {
                subjectField: "Subject",
                operator: "equal",
                values: ["yes"],
              },
            ],
          },
        }),
      ]),
    );

    const { fields } = await fetchMarketoForm(baseUrl, munchkinId, formId);

    expect(fields[0].visibilityRule?.defaultVisibility).toBe("hide");
  });

  it("sets blank defaults for visible fields and resolved defaults for hidden fields", async () => {
    mockFetchForm(marketoFormFixture);

    const { defaultValues } = await fetchMarketoForm(
      baseUrl,
      munchkinId,
      formId,
    );

    expect(defaultValues.TextField).toBe("");
    expect(defaultValues.PicklistField).toBe("");
    expect(defaultValues.HiddenField).toBe("hidden-value");
    expect(defaultValues.HiddenConstant).toBe("constant-default");
    expect(defaultValues.HiddenCookie).toBe("cookie-default");
    expect(defaultValues.HiddenUrl).toBe("url-default");
  });

  describe("hidden-field default resolution", () => {
    it("uses InputInitialValue when InputSourceChannel is missing", async () => {
      await expect(
        resolveHiddenDefault({ InputSourceChannel: undefined }),
      ).resolves.toBe("fallback");
    });

    it("uses InputInitialValue for constant fields", async () => {
      await expect(
        resolveHiddenDefault({ InputSourceChannel: "constant" }),
      ).resolves.toBe("fallback");
    });

    it.each(["cookie", "cookies"])(
      "resolves and decodes %s values from document.cookie",
      async (channel) => {
        setCookieHeader("utm_cookie=hello%20world; other=value");

        await expect(
          resolveHiddenDefault({
            InputSourceChannel: channel,
            InputSourceSelector: "utm_cookie",
          }),
        ).resolves.toBe("hello world");
      },
    );

    it("falls back for cookie fields without a selector", async () => {
      setCookieHeader("utm_cookie=value");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "cookie",
          InputSourceSelector: undefined,
        }),
      ).resolves.toBe("fallback");
    });

    it("falls back when the selected cookie is absent", async () => {
      setCookieHeader("other=value");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "cookie",
          InputSourceSelector: "utm_cookie",
        }),
      ).resolves.toBe("fallback");
    });

    it("returns raw malformed cookie values that cannot be decoded", async () => {
      setCookieHeader("utm_cookie=bad%ZZ");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "cookie",
          InputSourceSelector: "utm_cookie",
        }),
      ).resolves.toBe("bad%ZZ");
    });

    it("resolves url fields from window.location.search", async () => {
      window.history.pushState({}, "", "/?utm_source=newsletter");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "url",
          InputSourceSelector: "utm_source",
        }),
      ).resolves.toBe("newsletter");
    });

    it("falls back for url fields without a selector", async () => {
      window.history.pushState({}, "", "/?utm_source=newsletter");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "url",
          InputSourceSelector: undefined,
        }),
      ).resolves.toBe("fallback");
    });

    it("falls back when the selected url parameter is absent", async () => {
      window.history.pushState({}, "", "/?other=value");

      await expect(
        resolveHiddenDefault({
          InputSourceChannel: "url",
          InputSourceSelector: "utm_source",
        }),
      ).resolves.toBe("fallback");
    });

    it("uses InputInitialValue for unknown source channels", async () => {
      await expect(
        resolveHiddenDefault({ InputSourceChannel: "sessionStorage" }),
      ).resolves.toBe("fallback");
    });
  });
});
