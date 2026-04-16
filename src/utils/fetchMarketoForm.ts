import type {
  FormField,
  FormFieldOption,
  VisibilityRule,
} from "../types/FormData";

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

type MarketoVisibilityRuleItem = {
  subjectField: string;
  fieldLabel?: string;
  operator: string;
  values?: string[];
  altLabel?: string | null;
  picklistFilterValues?: MarketoPicklistValue[];
};

type MarketoVisibilityRule = {
  defaultVisibility?: "hide" | "show";
  rules?: MarketoVisibilityRuleItem[];
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
  VisibilityRule?: MarketoVisibilityRule;
};

type MarketoFormResponse = {
  rows: MarketoField[][];
};

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

function mapField(field: MarketoField): FormField | null {
  const base = {
    name: field.Name,
    label: field.InputLabel ?? "",
    placeholder: field.Htmltext,
    required: field.IsRequired ?? false,
    validationMessage: field.ValidationMessage?.trim() || undefined,
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
