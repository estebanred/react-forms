import type { FormField } from "../types/FormData";

type MarketoDatatype =
  | "string"
  | "email"
  | "phone"
  | "picklist"
  | "boolean"
  | "htmltext"
  | "checkbox"
  | "hidden"
  | "textarea"
  | "url"
  | "integer"
  | "float"
  | "currency"
  | "percent"
  | "score"
  | "date"
  | "datetime";

type MarketoPicklistValue = {
  label: string;
  value: string;
  selected?: boolean;
  isDefault?: boolean;
};

type MarketoField = {
  Id: number;
  Name: string;
  IsRequired?: boolean;
  Datatype: MarketoDatatype;
  InputLabel?: string;
  InputInitialValue?: string;
  PicklistValues?: MarketoPicklistValue[];
  Htmltext?: string;
  ValidationMessage?: string;
};

type MarketoFormResponse = {
  rows: MarketoField[][];
};

function mapField(field: MarketoField): FormField | null {
  const base = {
    name: field.Name,
    label: field.InputLabel ?? "",
    required: field.IsRequired ?? false,
  };

  const options = (field.PicklistValues ?? [])
    .filter((v) => v.value !== "")
    .map(({ label, value }) => ({ label, value }));

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
    case "checkbox":
      return options.length > 1
        ? { ...base, type: "Checkbox", options }
        : { ...base, type: "SingleCheckbox" };
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
  const fields = data.rows
    .map((row) => row[0])
    .filter(Boolean)
    .map(mapField)
    .filter((f): f is FormField => f !== null);

  const defaultValues = Object.fromEntries(fields.map((f) => [f.name, ""]));

  return { fields, defaultValues };
}
