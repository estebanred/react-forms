import type {
  FormField,
  FormFieldOption,
  VisibilityRule,
} from "../types/FormData";
import type {
  MarketoField,
  MarketoFormResponse,
  MarketoPicklistValue,
  MarketoVisibilityRule,
} from "../types/MarketoFormResponse";
import { resolveValidationMessageOverride } from "../config/validationMessageOverrides";

function mapOptions(values: MarketoPicklistValue[] = []): FormFieldOption[] {
  return values
    .filter((v) => v.value !== "")
    .map(({ label, value }) => ({ label, value }));
}

function mapVisibilityRule(
  visibilityRule?: MarketoVisibilityRule,
): VisibilityRule | undefined {
  if (!visibilityRule?.rules?.length) {
    return undefined;
  }

  return {
    defaultVisibility:
      visibilityRule.defaultVisibility === "show" ? "show" : "hide",
    rules: visibilityRule.rules.map((rule) => ({
      subjectField: rule.subjectField,
      fieldLabel: rule.fieldLabel,
      operator: rule.operator,
      values: rule.values ?? [],
      altLabel: rule.altLabel,
      picklistFilterValues: mapOptions(rule.picklistFilterValues),
    })),
  };
}

function mapField(field: MarketoField, formId: number): FormField | null {
  const customValidationMessage = resolveValidationMessageOverride(
    field.Name,
    formId,
  );
  const marketoValidationMessage = field.ValidationMessage?.trim();

  const base = {
    name: field.Name,
    label: field.InputLabel ?? "",
    placeholder: field.PlaceholderText ?? field.Htmltext,
    required: field.IsRequired ?? false,
    validationMessage: customValidationMessage ?? marketoValidationMessage,
    visibilityRule: mapVisibilityRule(field.VisibilityRule),
  };

  const options = mapOptions(field.PicklistValues);

  switch (field.Datatype) {
    case "string":
      return { ...base, type: "Text" };
    case "email":
      return { ...base, type: "Email" };
    case "phone":
      return { ...base, type: "Phone" };
    case "textarea":
      return { ...base, type: "TextArea" };
    case "url":
      return { ...base, type: "URL" };
    case "integer":
      return { ...base, type: "Integer" };
    case "float":
      return { ...base, type: "Float" };
    case "currency":
      return { ...base, type: "Currency" };
    case "percent":
      return { ...base, type: "Percent" };
    case "score":
      return { ...base, type: "Score" };
    case "date":
      return { ...base, type: "Date" };
    case "datetime":
      return { ...base, type: "DateTime" };
    case "boolean":
      return { ...base, type: "Boolean" };
    case "picklist":
      return { ...base, type: "Select", options };
    case "radio":
      return { ...base, type: "Radio", options };
    case "checkbox":
      return options.length > 1
        ? { ...base, type: "Checkbox", options }
        : { ...base, type: "SingleCheckbox", option: options[0] };
    case "htmltext":
      return { ...base, type: "HtmlText" };
    case "hidden":
      return { ...base, type: "Hidden" };
    default:
      return null;
  }
}

export type MarketoFormData = {
  fields: FormField[];
  defaultValues: Record<string, string>;
};

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveCookieValue(cookieName: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  for (const cookie of document.cookie.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name !== cookieName) {
      continue;
    }

    return safeDecodeURIComponent(valueParts.join("="));
  }

  return undefined;
}

function resolveQueryValue(paramName: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (
    new URLSearchParams(window.location.search).get(paramName) ?? undefined
  );
}

function resolveHiddenFieldValue(field?: MarketoField): string {
  if (!field || field.Datatype !== "hidden") {
    return "";
  }

  const fallbackValue = field.InputInitialValue ?? "";
  const sourceChannel = field.InputSourceChannel?.toLowerCase();
  const sourceSelector = field.InputSourceSelector?.trim();

  if (!sourceChannel) {
    return fallbackValue;
  }

  switch (sourceChannel) {
    case "constant":
      return fallbackValue;
    case "cookie":
    case "cookies":
      if (!sourceSelector) {
        return fallbackValue;
      }
      return resolveCookieValue(sourceSelector) ?? fallbackValue;
    case "url":
      if (!sourceSelector) {
        return fallbackValue;
      }
      return resolveQueryValue(sourceSelector) ?? fallbackValue;
    default:
      return fallbackValue;
  }
}

export async function fetchMarketoForm(
  baseUrl: string,
  munchkinId: string,
  formId: number,
): Promise<MarketoFormData> {
  const url = `${baseUrl}/index.php/form/getForm?munchkinId=${munchkinId}&form=${formId}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Failed to fetch Marketo form ${formId}: ${res.statusText}`,
    );

  const data = (await res.json()) as MarketoFormResponse;
  console.log(data);

  const rawFields = data.rows.map((row) => row[0]).filter(Boolean);

  const fields = rawFields
    .map((field) => mapField(field, formId))
    .filter((f): f is FormField => f !== null);

  const rawFieldByName = new Map(rawFields.map((field) => [field.Name, field]));
  const defaultValues = Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.type === "Hidden"
        ? resolveHiddenFieldValue(rawFieldByName.get(field.name))
        : "",
    ]),
  );

  return { fields, defaultValues };
}
